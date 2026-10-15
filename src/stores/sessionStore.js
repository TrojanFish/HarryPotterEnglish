import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', {
  state: () => ({
    currentStep: 1, // 1: 精听, 2: 跟读, 3: 听写, 4: 词汇复习
    completedSteps: []
  }),
  actions: {
    setStep(step) {
      if (typeof step === 'number' && step >= 1 && step <= 4) {
        this.currentStep = step
      }
    },
    advanceStep() {
      if (!this.completedSteps.includes(this.currentStep)) {
        this.completedSteps.push(this.currentStep)
      }
      if (this.currentStep < 4) {
        this.currentStep += 1
      } else {
        this.currentStep = 1 // cycle or reset
      }
    },
    isStepCompleted(step) {
      return this.completedSteps.includes(step)
    }
  }
})
