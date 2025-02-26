import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useAbly } from '@/services/ably'

export const useBillingStore = defineStore('billing', () => {
  // État
  const invoices = ref([])
  const payments = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const allInvoices = computed(() => invoices.value)
  const allPayments = computed(() => payments.value)
  const totalRevenue = computed(() => 
    payments.value
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
  )
  const overdueInvoices = computed(() => 
    invoices.value.filter(inv => inv.status === 'overdue')
  )

  // Actions
  const fetchInvoices = async (dateRange = {}) => {
    try {
      loading.value = true
      const response = await axios.get('/api/invoices', { params: dateRange })
      invoices.value = response.data
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchPayments = async (dateRange = {}) => {
    try {
      loading.value = true
      const response = await axios.get('/api/payments', { params: dateRange })
      payments.value = response.data
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const createInvoice = async (invoice) => {
    try {
      loading.value = true
      const response = await axios.post('/api/invoices', invoice)
      invoices.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateInvoice = async (invoice) => {
    try {
      loading.value = true
      const response = await axios.put(`/api/invoices/${invoice.id}`, invoice)
      const index = invoices.value.findIndex(inv => inv.id === invoice.id)
      if (index !== -1) {
        invoices.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteInvoice = async (id) => {
    try {
      loading.value = true
      await axios.delete(`/api/invoices/${id}`)
      invoices.value = invoices.value.filter(inv => inv.id !== id)
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const processPayment = async (payment) => {
    try {
      loading.value = true
      const response = await axios.post('/api/payments', payment)
      payments.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  const refundPayment = async (paymentId, amount) => {
    try {
      loading.value = true
      const response = await axios.post(`/api/payments/${paymentId}/refund`, { amount })
      const index = payments.value.findIndex(p => p.id === paymentId)
      if (index !== -1) {
        payments.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  // Temps réel
  const { channel } = useAbly()
  
  channel.subscribe('invoice.created', (message) => {
    invoices.value.push(message.data)
  })

  channel.subscribe('invoice.updated', (message) => {
    const updatedInvoice = message.data
    const index = invoices.value.findIndex(inv => inv.id === updatedInvoice.id)
    if (index !== -1) {
      invoices.value[index] = updatedInvoice
    }
  })

  channel.subscribe('invoice.deleted', (message) => {
    invoices.value = invoices.value.filter(inv => inv.id !== message.data.id)
  })

  channel.subscribe('payment.created', (message) => {
    payments.value.push(message.data)
  })

  channel.subscribe('payment.updated', (message) => {
    const updatedPayment = message.data
    const index = payments.value.findIndex(p => p.id === updatedPayment.id)
    if (index !== -1) {
      payments.value[index] = updatedPayment
    }
  })

  return {
    // État
    invoices,
    payments,
    loading,
    error,
    
    // Getters
    allInvoices,
    allPayments,
    totalRevenue,
    overdueInvoices,
    
    // Actions
    fetchInvoices,
    fetchPayments,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    processPayment,
    refundPayment
  }
})
