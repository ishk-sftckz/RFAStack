import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { resolve, relative, dirname } from 'node:path'

const errors: string[] = []

for (const file of new Bun.Glob('{src,backend}/**/*.{ts,tsx}').scanSync('.')) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  const from = file.split('/')
  const client = source.statements.some(
    (statement) =>
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression) &&
      statement.expression.text === 'use client',
  )

  function check(specifier: string, typeOnly = false) {
    const target = specifier.startsWith('@/')
      ? `src/${specifier.slice(2)}`
      : specifier.startsWith('@backend/')
        ? `backend/${specifier.slice(9)}`
        : specifier.startsWith('.')
          ? relative(process.cwd(), resolve(dirname(file), specifier))
          : ''

    if (!target) {
      return
    }

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

    if (foreignFeature && /\.(table|repository|dto)(\.|$)/.test(target)) {
      errors.push(`${file}: private feature dependency ${specifier}`)
    }

    if (client && /\/server\//.test(target) && !/\.actions$/.test(target) && !typeOnly) {
      errors.push(`${file}: client imports server implementation ${specifier}`)
    }
  }

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause
      const allTypes =
        clause?.namedBindings &&
        ts.isNamedImports(clause.namedBindings) &&
        !clause.name &&
        clause.namedBindings.elements.every((element) => element.isTypeOnly)
      check(node.moduleSpecifier.text, Boolean(clause?.isTypeOnly || allTypes))
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
