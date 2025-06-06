// Mejoras sugeridas para tu Pinia Store

import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useProjectStore = defineStore('project', () => {
  // Estado
  const projects = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Configurar base URL - considera usar variables de entorno
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://gestor-proyectos-production.up.railway.app/'

  // Función helper para manejar errores
  const handleError = (err, defaultMessage) => {
    console.error(defaultMessage, err)
    const errorMessage =
      err.response?.data?.message || err.response?.data?.error || err.message || defaultMessage
    error.value = errorMessage
    return errorMessage
  }

  // Obtener todos los proyectos
  const fetchAllProjects = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.get(`${API_BASE}/api/projects`, {
        timeout: 10000, // 10 segundos de timeout
      })

      projects.value = response.data || []
      console.log('Proyectos cargados:', projects.value.length)
    } catch (err) {
      handleError(err, 'Error al cargar proyectos')
    } finally {
      loading.value = false
    }
  }

  // CREAR PROYECTO GUEST - Mejorado
  const createGuestProject = async (projectData) => {
    try {
      loading.value = true
      error.value = null

      // Validar datos antes de enviar
      if (!projectData.name || !projectData.description) {
        throw new Error('Nombre y descripción son obligatorios')
      }

      console.log('Store: Enviando proyecto guest:', projectData)

      const response = await axios.post(`${API_BASE}/api/projects/guest`, projectData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      console.log('Store: Respuesta del servidor:', response.data)

      // Agregar el nuevo proyecto a la lista local
      if (response.data) {
        projects.value.push(response.data)
      }

      return response.data
    } catch (err) {
      const errorMessage = handleError(err, 'Error al crear proyecto guest')
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // CREAR PROYECTO ADMIN - Mejorado
  const createAdminProject = async (projectData, username, password) => {
    try {
      loading.value = true
      error.value = null

      // Validar credenciales
      if (!username || !password) {
        throw new Error('Se requieren credenciales de administrador')
      }

      // Validar datos del proyecto
      if (!projectData.name || !projectData.description) {
        throw new Error('Nombre y descripción son obligatorios')
      }

      const auth = btoa(`${username}:${password}`)
      const response = await axios.post(`${API_BASE}/api/projects/admin`, projectData, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      // Agregar el nuevo proyecto a la lista local
      if (response.data) {
        projects.value.push(response.data)
      }

      return response.data
    } catch (err) {
      const errorMessage = handleError(err, 'Error al crear proyecto admin')
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // ACTUALIZAR PROYECTO ADMIN - Mejorado
  const updateAdminProject = async (id, projectData, username, password) => {
    try {
      loading.value = true
      error.value = null

      // Validar parámetros
      if (!id) {
        throw new Error('ID del proyecto es requerido')
      }
      if (!username || !password) {
        throw new Error('Se requieren credenciales de administrador')
      }
      if (!projectData.name || !projectData.description) {
        throw new Error('Nombre y descripción son obligatorios')
      }

      const auth = btoa(`${username}:${password}`)
      const response = await axios.put(`${API_BASE}/api/projects/admin/${id}`, projectData, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      // Actualizar el proyecto en la lista local
      const index = projects.value.findIndex((p) => p.id === parseInt(id))
      if (index !== -1 && response.data) {
        projects.value[index] = response.data
      }

      return response.data
    } catch (err) {
      const errorMessage = handleError(err, 'Error al actualizar proyecto admin')
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // ELIMINAR PROYECTO ADMIN - Mejorado
  const deleteAdminProject = async (id, username, password) => {
    try {
      loading.value = true
      error.value = null

      // Validar parámetros
      if (!id) {
        throw new Error('ID del proyecto es requerido')
      }
      if (!username || !password) {
        throw new Error('Se requieren credenciales de administrador')
      }

      const auth = btoa(`${username}:${password}`)
      await axios.delete(`${API_BASE}/api/projects/admin/${id}`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        timeout: 10000,
      })

      // Eliminar el proyecto de la lista local
      projects.value = projects.value.filter((p) => p.id !== parseInt(id))
    } catch (err) {
      const errorMessage = handleError(err, 'Error al eliminar proyecto admin')
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // OBTENER PROYECTO POR ID - Nueva función
  const getProjectById = async (id) => {
    try {
      loading.value = true
      error.value = null

      const response = await axios.get(`${API_BASE}/api/projects/${id}`, {
        timeout: 10000,
      })

      return response.data
    } catch (err) {
      handleError(err, 'Error al obtener proyecto por ID')
      throw err
    } finally {
      loading.value = false
    }
  }

  // LIMPIAR ERRORES
  const clearError = () => {
    error.value = null
  }

  return {
    // Estado
    projects,
    loading,
    error,

    // Acciones
    fetchAllProjects,
    createGuestProject,
    createAdminProject,
    updateAdminProject,
    deleteAdminProject,
    getProjectById,
    clearError,
  }
})
