import { createContext, useContext, type ParentComponent } from 'solid-js'
import { createSignal } from 'solid-js'
import { flatten, translator, resolveTemplate } from '@solid-primitives/i18n'
import { en, exerciseAreaNames as enAreas, muscleGroupNames as enMuscleGroups, exerciseTypeNames as enExerciseTypes } from './en'
import { ru, exerciseAreaNames as ruAreas, muscleGroupNames as ruMuscleGroups, exerciseTypeNames as ruExerciseTypes } from './ru'
import type { Dictionary } from './en'

const dictionaries: Record<string, Dictionary> = { en, ru }

const areaNameMaps: Record<string, Record<string, string>> = { en: enAreas, ru: ruAreas }
const muscleGroupMaps: Record<string, Record<string, string>> = { en: enMuscleGroups, ru: ruMuscleGroups }
const exerciseTypeMaps: Record<string, Record<string, string>> = { en: enExerciseTypes, ru: ruExerciseTypes }

export type SupportedLocale = 'en' | 'ru'

export const localeLabels: Record<SupportedLocale, string> = {
  en: 'EN',
  ru: 'RU',
}

// BCP 47 locale tags for Intl APIs (dates, numbers, etc.)
export const bcp47Map: Record<SupportedLocale, string> = {
  en: 'en-US',
  ru: 'ru-RU',
}

function createI18n(initial: SupportedLocale) {
  const [locale, setLocale] = createSignal<SupportedLocale>(initial)

  const dict = () => flatten(dictionaries[locale()])
  const t = translator(dict, resolveTemplate)

  return { t, locale, setLocale }
}

type I18nContextType = ReturnType<typeof createI18n>

const I18nContext = createContext<I18nContextType>()

export const I18nProvider: ParentComponent = (props) => {
  const saved = localStorage.getItem('goliath-locale') as SupportedLocale | null
  const browserLang = navigator.language.split('-')[0] as SupportedLocale
  const initial: SupportedLocale = saved ?? (browserLang in dictionaries ? browserLang : 'en')

  const i18n = createI18n(initial)

  // Wrap setLocale to persist
  const originalSet = i18n.setLocale
  i18n.setLocale = ((l: SupportedLocale) => {
    localStorage.setItem('goliath-locale', l)
    originalSet(l)
  }) as typeof originalSet

  return (
    <I18nContext.Provider value={i18n}>
      {props.children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** Get the BCP 47 locale string for Intl formatting APIs */
export function useDateLocale() {
  const { locale } = useI18n()
  return () => bcp47Map[locale()]
}

/**
 * Returns a reactive function that translates backend exercise-area names.
 * If a name is not in the map, it falls back to the original backend name.
 */
export function useTranslateArea() {
  const { locale } = useI18n()
  return (backendName: string): string => {
    const map = areaNameMaps[locale()]
    return map?.[backendName] ?? backendName
  }
}

/** Translates backend muscle-group names to the current locale. */
export function useTranslateMuscleGroup() {
  const { locale } = useI18n()
  return (backendName: string): string => {
    const map = muscleGroupMaps[locale()]
    return map?.[backendName] ?? backendName
  }
}

/** Translates backend exercise-type names to the current locale. */
export function useTranslateExerciseType() {
  const { locale } = useI18n()
  return (backendName: string): string => {
    const map = exerciseTypeMaps[locale()]
    return map?.[backendName] ?? backendName
  }
}

/** Simple plural helper: returns singular for 1, plural otherwise */
export function plural(count: number, one: string, other: string): string {
  return count === 1 ? `${count} ${one}` : `${count} ${other}`
}
