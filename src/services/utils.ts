export const sleep = (ms = 0) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Validation */
export const validators = {
  email: (v: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(v) || 'Por favor, ingresa una dirección de correo electrónico válida'
  },
  required: (v: any) => !!v || 'Este campo es obligatorio',
}
