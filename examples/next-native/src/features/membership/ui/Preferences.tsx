import { ActionForm } from '@/shared/ui/ActionForm'
import { preferencesAction } from '../membership.actions'

export function Preferences({ preference }: { preference: string }) {
  return (
    <section>
      <h2>Delivery preferences</h2>
      <ActionForm action={preferencesAction} label="Save preferences">
        <label>
          Delivery speed
          <select name="preference" defaultValue={preference}>
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
        </label>
      </ActionForm>
    </section>
  )
}
