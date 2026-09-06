import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { resolve, relative, dirname } from 'node:path'

const errors: string[] = []

const modules = new Map(
  [...new Bun.Glob('{src,backend}/**/*.{ts,tsx}').scanSync('.')].map((file) => [
    file,
    ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true),
  ]),
)

for (const [file, source] of modules) {
  const from = file.split('/')
  const client = source.statements.some(
    (statement) =>
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression) &&
      statement.expression.text === 'use client',
  )

  function check(specifier: string, typeOnly = false, schemaReference = false) {
    const unresolved = specifier.startsWith('@/')
      ? `src/${specifier.slice(2)}`
      : specifier.startsWith('@backend/')
        ? `backend/${specifier.slice(9)}`
        : specifier.startsWith('.')
          ? relative(process.cwd(), resolve(dirname(file), specifier))
          : ''

    if (!unresolved) {
      return
    }

    const target = relative(process.cwd(), resolve(unresolved))
    const to = target.split('/')

    if (from[0] !== to[0]) {
      errors.push(`${file}: frontend/backend dependencies must cross HTTP: ${specifier}`)
    }

    if (
      (from[1] === 'platform' && ['features', 'app'].includes(to[1])) ||
      (from[1] === 'shared' && ['features', 'app', 'platform'].includes(to[1])) ||
      (from[1] === 'features' && to[1] === 'app')
    ) {
      errors.push(`${file}: forbidden dependency ${specifier}`)
    }

    const foreignFeature = to[1] === 'features' && (from[1] !== 'features' || from[2] !== to[2])

    const mountsTransport = from[1] === 'app' || file === 'backend/server.ts'
    const mountsAuth =
      /^src\/app\/api\/auth\/.*route\.ts$/.test(file) || file === 'backend/server.ts'
    const publicServerOperation =
      /\.(queries|actions|use-case)(\.[cm]?tsx?)?$/.test(target) ||
      (mountsTransport && /\.rpc(\.[cm]?tsx?)?$/.test(target)) ||
      (mountsAuth && /\/features\/auth\/auth\.provider(\.[cm]?tsx?)?$/.test(target))
    const publicFeatureModule =
      publicServerOperation ||
      ['ui', 'model'].includes(to[3]) ||
      /\.(api|client|query-options|mutation-options)(\.[cm]?tsx?)?$/.test(target)

    if (
      foreignFeature &&
      !schemaReference &&
      (!publicFeatureModule || /\.(table|repository|dto)(\.|$)/.test(target))
    ) {
      errors.push(`${file}: private feature dependency ${specifier}`)
    }

    const targetSource = [
      target,
      `${target}.ts`,
      `${target}.tsx`,
      `${target}/index.ts`,
      `${target}/index.tsx`,
    ]
      .map((path) => modules.get(path))
      .find((module) => module !== undefined)
    const markedServerOnly = targetSource?.statements.some(
      (statement) =>
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text === 'server-only',
    )
    const serverImplementation =
      /\.(queries|use-case|rpc|table|repository|dto|provider)(\.[cm]?tsx?)?$/.test(target) ||
      /\/server(\.[cm]?tsx?)?$/.test(target) ||
      markedServerOnly

    if (client && serverImplementation && !typeOnly) {
      errors.push(`${file}: client imports server implementation ${specifier}`)
    }
  }

  // A table may reference a foreign column to declare an existing database relationship.
  // It may not use that imported table to query data or re-export it.
  function isSchemaReference(node: ts.ImportDeclaration) {
    if (
      !file.endsWith('.table.ts') ||
      !ts.isStringLiteral(node.moduleSpecifier) ||
      !/\.table(?:\.ts)?$/.test(node.moduleSpecifier.text)
    )
      return false
    const bindings = node.importClause?.namedBindings
    if (node.importClause?.name || !bindings || !ts.isNamedImports(bindings)) return false
    const names = new Set(bindings.elements.map((element) => element.name.text))
    let uses = 0
    let valid = true
    function inspect(current: ts.Node) {
      if (ts.isImportDeclaration(current)) return
      if (ts.isIdentifier(current) && names.has(current.text)) {
        uses++
        const member = current.parent
        const callback = member.parent
        const call = callback.parent
        if (
          !(
            ts.isPropertyAccessExpression(member) &&
            member.expression === current &&
            ts.isArrowFunction(callback) &&
            callback.body === member &&
            ts.isCallExpression(call) &&
            call.arguments[0] === callback &&
            ts.isPropertyAccessExpression(call.expression) &&
            call.expression.name.text === 'references'
          )
        ) {
          valid = false
        }
      }
      ts.forEachChild(current, inspect)
    }
    inspect(source)
    return valid && uses > 0
  }

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause
      const allTypes =
        clause?.namedBindings &&
        ts.isNamedImports(clause.namedBindings) &&
        !clause.name &&
        clause.namedBindings.elements.every((element) => element.isTypeOnly)
      check(
        node.moduleSpecifier.text,
        Boolean(clause?.isTypeOnly || allTypes),
        isSchemaReference(node),
      )
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      check(node.moduleSpecifier.text, node.isTypeOnly)
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      check(node.arguments[0].text)
    }

    ts.forEachChild(node, visit)
  }

  visit(source)
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.info('Feature and runtime import boundaries passed.')
