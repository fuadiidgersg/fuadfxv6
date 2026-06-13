import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export function SettingsAppearance() {
  return (
    <ContentSection
      title='Personalisation'
      desc='Customize the theme, layout and visual preferences of the app.'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
