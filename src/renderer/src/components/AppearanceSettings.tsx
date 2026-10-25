import { InteractiveButton } from './HoverFeedback'
import { useId, useState, type CSSProperties } from 'react'
import { MATERIALS, THEMES, resetAppearance, setMaterial, setMaterialStrength, setTheme, useAppearance } from '../theme'
import { t } from '../i18n'

export function AppearanceSettings(): JSX.Element {
  const { theme, material, strength } = useAppearance()
  const [section, setSection] = useState<'colors' | 'materials'>('colors')
  const strengthId = useId()
  return <div className="appearance-settings">
    <div className="appearance-demo musy-surface">
      <div className="appearance-demo-top">
        <div className="appearance-demo-ball mascot-material" aria-hidden="true"><i /><i /></div>
        <div className="appearance-demo-title"><strong>{t(`settings.theme.${theme}`)} · {t(`appearance.material.${material}`)}</strong><span>{t('appearance.live')}</span></div>
      </div>
      <div className="appearance-demo-lines" aria-hidden="true"><i /><i /><i /></div>
    </div>
    <div className="appearance-segments" role="group" aria-label={t('settings.appearance')}>
      <InteractiveButton type="button" aria-pressed={section === 'colors'} onClick={() => setSection('colors')}>{t('settings.themeTitle')} · {THEMES.length}</InteractiveButton>
      <InteractiveButton type="button" aria-pressed={section === 'materials'} onClick={() => setSection('materials')}>{t('appearance.materialTitle')} · {MATERIALS.length}</InteractiveButton>
    </div>
    <p className="appearance-help">{t(section === 'colors' ? 'settings.themeDesc' : 'appearance.materialDesc')}</p>
    {section === 'colors' ? <div className="appearance-color-grid">
      {THEMES.map(option => <InteractiveButton key={option.id} type="button" className="appearance-color-option" aria-pressed={theme === option.id}
        onClick={() => setTheme(option.id)} aria-label={t(`settings.theme.${option.id}`)}
        style={{ ...option.variables, backgroundColor: option.surface, color: option.variables['--text-primary'] } as CSSProperties}>
        <span aria-hidden="true"><i style={{ backgroundColor: option.swatch }} /><i style={{ backgroundColor: option.swatch }} /></span>
        <span className="appearance-option-name">{t(`settings.theme.${option.id}`)}{theme === option.id && <span aria-hidden="true">✓</span>}</span>
      </InteractiveButton>)}
    </div> : <>
      <div className="appearance-material-grid">
        {MATERIALS.map(option => <InteractiveButton key={option.id} type="button" className="appearance-material-option" aria-pressed={material === option.id}
          onClick={() => setMaterial(option.id)} aria-label={t(`appearance.material.${option.id}`)}>
          <span className="appearance-material-swatch musy-surface" data-material-sample={option.id} aria-hidden="true"><i /><i /></span>
          <span className="appearance-option-name"><strong>{t(`appearance.material.${option.id}`)}</strong>{material === option.id && <span aria-hidden="true">✓</span>}</span>
          <small>{t(`appearance.material.${option.id}Desc`)}</small>
        </InteractiveButton>)}
      </div>
      <div className="appearance-strength"><label htmlFor={strengthId}>{t('appearance.strength')}</label><output htmlFor={strengthId}>{material === 'smooth' ? '—' : `${strength}%`}</output>
        <input id={strengthId} type="range" min="0" max="100" step="5" value={strength} disabled={material === 'smooth'} title={t(material === 'smooth' ? 'appearance.chooseMaterial' : 'appearance.strength')} onChange={event => setMaterialStrength(Number(event.target.value))} />
      </div>
    </>}
    <InteractiveButton type="button" className="appearance-reset" onClick={resetAppearance}>{t('appearance.reset')}</InteractiveButton>
  </div>
}
