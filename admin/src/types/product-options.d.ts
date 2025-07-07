export interface OptionChoice {
  id: number
  name: string
  pricing_type: 'free' | 'one_time' | 'recurring'
  price: number
}

export interface ConfigurableOption {
  id: number
  name: string
  type: 'dropdown' | 'radio' | 'checkbox' | 'quantity'
  required: boolean
  pricing_type?: 'free' | 'one_time' | 'recurring'
  price?: number
  min_quantity?: number
  max_quantity?: number
  choices: OptionChoice[]
}

export interface NewOptionForm {
  id: number | null
  name: string
  type: 'dropdown' | 'radio' | 'checkbox' | 'quantity'
  required: boolean
  pricing_type: 'free' | 'one_time' | 'recurring'
  price: number
  min_quantity: number
  max_quantity: number
  choices: OptionChoice[]
}
