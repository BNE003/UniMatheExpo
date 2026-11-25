/**
 * Erlaubt Bildschirmen innerhalb der App, das Onboarding erneut zu starten
 * (OnboardingManager.resetOnboarding in iOS). Wird von der App-Wurzel bereitgestellt.
 */
import { createContext, useContext } from 'react';

export const OnboardingRestartContext = createContext<() => void>(() => {});

export const useRestartOnboarding = () => useContext(OnboardingRestartContext);
