<template>
  <div class="home-view">
    <h1>Gestor de Proyectos GILD</h1>

    <div class="header-buttons">
      <button
        @click="showGuestForm = true"
        @mouseover="showGuestTooltip = true"
        @mouseleave="showGuestTooltip = false"
      >
        Invitado
      </button>
      <span v-if="showGuestTooltip" class="tooltip">El proyecto será temporal y se eliminará.</span>

      <button
        @click="showAdminLogin = true"
        @mouseover="showAdminTooltip = true"
        @mouseleave="showAdminTooltip = false"
      >
        Administrador
      </button>
      <span v-if="showAdminTooltip" class="tooltip">Permite gestionar proyectos permanentes.</span>
    </div>

    <div v-if="showGuestForm" class="modal">
      <div class="modal-content">
        <h2>Crear Proyecto de Invitado</h2>
        <form @submit.prevent="submitGuestProject">
          <label for="guestName">Nombre:</label>
          <input type="text" id="guestName" v-model="guestProject.name" required />
          <p v-if="guestFormErrors.name" class="error-message">{{ guestFormErrors.name }}</p>

          <label for="guestDescription">Descripción:</label>
          <textarea id="guestDescription" v-model="guestProject.description" required></textarea>
          <p v-if="guestFormErrors.description" class="error-message">
            {{ guestFormErrors.description }}
          </p>

          <label for="guestImageUrl">URL Imagen:</label>
          <input type="url" id="guestImageUrl" v-model="guestProject.imageUrl" />
          <p v-if="guestFormErrors.imageUrl" class="error-message">
            {{ guestFormErrors.imageUrl }}
          </p>

          <label for="guestProjectUrl">URL Proyecto:</label>
          <input type="url" id="guestProjectUrl" v-model="guestProject.projectUrl" />
          <p v-if="guestFormErrors.projectUrl" class="error-message">
            {{ guestFormErrors.projectUrl }}
          </p>

          <label for="guestTechnologies">Tecnologías (separadas por comas):</label>
          <input type="text" id="guestTechnologies" v-model="guestProject.technologiesInput" />

          <button type="submit" :disabled="isSubmittingGuest">
            {{ isSubmittingGuest ? 'Creando...' : 'Crear Proyecto' }}
          </button>
          <button type="button" @click="closeGuestForm">Cancelar</button>
        </form>
        <p v-if="projectStore.error" class="error-message">{{ projectStore.error }}</p>
      </div>
    </div>

    <div v-if="showAdminLogin" class="modal">
      <div class="modal-content">
        <h2>Acceso de Administrador</h2>
        <form @submit.prevent="loginAndShowAdminPanel">
          <label for="adminUsername">Usuario:</label>
          <input type="text" id="adminUsername" v-model="adminCredentials.username" required />

          <label for="adminPassword">Contraseña:</label>
          <input type="password" id="adminPassword" v-model="adminCredentials.password" required />

          <button type="submit">Iniciar Sesión</button>
          <button type="button" @click="closeAdminLogin">Cancelar</button>
        </form>
        <p v-if="adminLoginError" class="error-message">{{ adminLoginError }}</p>
      </div>
    </div>

    <div v-if="isAdminLoggedIn" class="admin-panel">
      <h2>Panel de Administración</h2>
      <div class="admin-actions">
        <button
          @click="selectAdminAction('POST')"
          :class="{ 'active-action': currentAdminAction === 'POST' }"
        >
          Crear Proyecto
        </button>
        <button
          @click="selectAdminAction('PUT')"
          :class="{ 'active-action': currentAdminAction === 'PUT' }"
        >
          Actualizar Proyecto
        </button>
        <button
          @click="selectAdminAction('DELETE')"
          :class="{ 'active-action': currentAdminAction === 'DELETE' }"
        >
          Eliminar Proyecto
        </button>
        <button @click="logoutAdmin" class="logout-button">Cerrar Sesión</button>
      </div>

      <form @submit.prevent="submitAdminAction" class="admin-form" v-if="currentAdminAction">
        <div v-if="currentAdminAction === 'PUT' || currentAdminAction === 'DELETE'">
          <label for="projectId">ID del Proyecto:</label>
          <input type="number" id="projectId" v-model.number="adminProject.id" required />
          <p v-if="adminFormErrors.id" class="error-message">{{ adminFormErrors.id }}</p>
        </div>

        <div v-if="currentAdminAction === 'POST' || currentAdminAction === 'PUT'">
          <label for="adminName">Nombre:</label>
          <input
            type="text"
            id="adminName"
            v-model="adminProject.name"
            :required="currentAdminAction !== 'DELETE'"
          />
          <p v-if="adminFormErrors.name" class="error-message">{{ adminFormErrors.name }}</p>

          <label for="adminDescription">Descripción:</label>
          <textarea
            id="adminDescription"
            v-model="adminProject.description"
            :required="currentAdminAction !== 'DELETE'"
          ></textarea>
          <p v-if="adminFormErrors.description" class="error-message">
            {{ adminFormErrors.description }}
          </p>

          <label for="adminImageUrl">URL Imagen:</label>
          <input type="url" id="adminImageUrl" v-model="adminProject.imageUrl" />
          <p v-if="adminFormErrors.imageUrl" class="error-message">
            {{ adminFormErrors.imageUrl }}
          </p>

          <label for="adminProjectUrl">URL Proyecto:</label>
          <input type="url" id="adminProjectUrl" v-model="adminProject.projectUrl" />
          <p v-if="adminFormErrors.projectUrl" class="error-message">
            {{ adminFormErrors.projectUrl }}
          </p>

          <label for="adminTechnologies">Tecnologías (separadas por comas):</label>
          <input type="text" id="adminTechnologies" v-model="adminProject.technologiesInput" />
        </div>

        <button type="submit" :disabled="isSubmittingAdmin">{{ getAdminButtonText }}</button>
        <button type="button" @click="resetAdminPanel">Cancelar</button>
      </form>
      <p v-if="projectStore.error" class="error-message">{{ projectStore.error }}</p>
    </div>

    <div v-if="projectStore.loading" class="loading-message">Cargando proyectos...</div>
    <div v-if="projectStore.error && !showGuestForm && !showAdminLogin" class="error-message">
      {{ projectStore.error }}
    </div>

    <div class="project-list">
      <div v-for="project in projectStore.projects" :key="project.id" class="project-card">
        <h3>{{ project.name }}</h3>
        <p class="description">{{ project.description }}</p>
        <img
          v-if="project.imageUrl"
          :src="project.imageUrl"
          :alt="`Imagen de ${project.name}`"
          class="project-image"
        />
        <p v-if="project.projectUrl">
          <a :href="project.projectUrl" target="_blank" rel="noopener noreferrer">Ver Proyecto</a>
        </p>
        <div class="technologies">
          <span v-for="tech in project.technologies" :key="tech" class="tech-tag">{{ tech }}</span>
        </div>
        <div class="project-footer">
          <p class="project-type">
            {{ project.guestProject ? 'Temporal (Invitado)' : 'Permanente (Administrador)' }}
          </p>
          <p class="project-created">Creado: {{ new Date(project.createdAt).toLocaleString() }}</p>
        </div>
      </div>
      <div
        v-if="projectStore.projects.length === 0 && !projectStore.loading"
        class="no-projects-message"
      >
        No hay proyectos disponibles. ¡Crea uno!
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useProjectStore } from '@/stores/projectStore'

const projectStore = useProjectStore()

// --- Estado para formulario Invitado ---
const showGuestForm = ref(false)
const isSubmittingGuest = ref(false)
const guestProject = ref({
  name: '',
  description: '',
  imageUrl: '',
  projectUrl: '',
  technologiesInput: '',
})

// --- Estado para Inicio de Sesión de Administrador ---
const showAdminLogin = ref(false)
const adminCredentials = ref({
  username: '',
  password: '',
})
const isAdminLoggedIn = ref(false)
const adminLoginError = ref(null)

// --- Estado para Panel de Administrador ---
const currentAdminAction = ref(null)
const isSubmittingAdmin = ref(false)
const adminProject = ref({
  id: null,
  name: '',
  description: '',
  imageUrl: '',
  projectUrl: '',
  technologiesInput: '',
})

// --- Tooltips ---
const showGuestTooltip = ref(false)
const showAdminTooltip = ref(false)

// --- Estados de validación ---
const guestFormErrors = ref({})
const adminFormErrors = ref({})

// --- Propiedades Computadas ---
const getAdminButtonText = computed(() => {
  switch (currentAdminAction.value) {
    case 'POST':
      return isSubmittingAdmin.value ? 'Creando...' : 'Crear Proyecto Admin'
    case 'PUT':
      return isSubmittingAdmin.value ? 'Actualizando...' : 'Actualizar Proyecto Admin'
    case 'DELETE':
      return isSubmittingAdmin.value ? 'Eliminando...' : 'Eliminar Proyecto Admin'
    default:
      return 'Selecciona una acción'
  }
})

// --- Funciones de validación ---
const isValidUrl = (string) => {
  if (!string || string.trim() === '') return true // URL vacía es válida (opcional)
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

const validateGuestProject = () => {
  const errors = {}

  if (!guestProject.value.name.trim()) {
    errors.name = 'El nombre del proyecto es obligatorio.'
  }

  if (!guestProject.value.description.trim()) {
    errors.description = 'La descripción del proyecto es obligatoria.'
  }

  if (guestProject.value.projectUrl && !isValidUrl(guestProject.value.projectUrl)) {
    errors.projectUrl = 'La URL del proyecto no es válida.'
  }

  if (guestProject.value.imageUrl && !isValidUrl(guestProject.value.imageUrl)) {
    errors.imageUrl = 'La URL de la imagen no es válida.'
  }

  guestFormErrors.value = errors
  return Object.keys(errors).length === 0
}

const validateAdminProject = () => {
  const errors = {}

  if (currentAdminAction.value === 'PUT' || currentAdminAction.value === 'DELETE') {
    if (!adminProject.value.id) {
      errors.id = 'El ID del proyecto es obligatorio para esta acción.'
    }
  }

  if (currentAdminAction.value === 'POST' || currentAdminAction.value === 'PUT') {
    if (!adminProject.value.name.trim()) {
      errors.name = 'El nombre del proyecto es obligatorio.'
    }

    if (!adminProject.value.description.trim()) {
      errors.description = 'La descripción del proyecto es obligatoria.'
    }

    if (adminProject.value.projectUrl && !isValidUrl(adminProject.value.projectUrl)) {
      errors.projectUrl = 'La URL del proyecto no es válida.'
    }

    if (adminProject.value.imageUrl && !isValidUrl(adminProject.value.imageUrl)) {
      errors.imageUrl = 'La URL de la imagen no es válida.'
    }
  }

  adminFormErrors.value = errors
  return Object.keys(errors).length === 0
}

// --- Funciones para resetear formularios ---
const resetGuestForm = () => {
  guestProject.value = {
    name: '',
    description: '',
    imageUrl: '',
    projectUrl: '',
    technologiesInput: '',
  }
  guestFormErrors.value = {}
}

const resetAdminPanel = () => {
  currentAdminAction.value = null
  adminProject.value = {
    id: null,
    name: '',
    description: '',
    imageUrl: '',
    projectUrl: '',
    technologiesInput: '',
  }
  adminFormErrors.value = {}
}

// --- Métodos principales ---
onMounted(() => {
  projectStore.fetchAllProjects()
})

const submitGuestProject = async () => {
  try {
    // Limpiar errores previos
    projectStore.clearError()

    // Validar formulario
    if (!validateGuestProject()) {
      return
    }

    isSubmittingGuest.value = true
    console.log('Creando proyecto invitado:', guestProject.value)

    const projectData = {
      name: guestProject.value.name.trim(),
      description: guestProject.value.description.trim(),
      imageUrl: guestProject.value.imageUrl.trim() || null,
      projectUrl: guestProject.value.projectUrl.trim() || null,
      technologies: guestProject.value.technologiesInput
        ? guestProject.value.technologiesInput
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [],
    }

    console.log('Datos a enviar:', projectData)

    // Llama a la función del store
    await projectStore.createGuestProject(projectData)

    alert('¡Proyecto de invitado creado con éxito!')
    showGuestForm.value = false
    resetGuestForm()

    // Recargar la lista de proyectos
    await projectStore.fetchAllProjects()
  } catch (error) {
    console.error('Error al crear proyecto invitado:', error)

    let errorMessage = 'Error desconocido'
    if (error.message) {
      errorMessage = error.message
    } else if (projectStore.error) {
      errorMessage = projectStore.error
    }

    alert(`Error al crear proyecto de invitado: ${errorMessage}`)
  } finally {
    isSubmittingGuest.value = false
  }
}

const loginAndShowAdminPanel = async () => {
  try {
    adminLoginError.value = null

    if (!adminCredentials.value.username.trim()) {
      adminLoginError.value = 'El usuario es obligatorio.'
      return
    }

    if (!adminCredentials.value.password.trim()) {
      adminLoginError.value = 'La contraseña es obligatoria.'
      return
    }

    // Verificación simple (en producción esto debería ser una llamada al backend)
    if (
      adminCredentials.value.username === 'admin' &&
      adminCredentials.value.password === 'admin'
    ) {
      isAdminLoggedIn.value = true
      showAdminLogin.value = false
      adminLoginError.value = null
    } else {
      adminLoginError.value = 'Credenciales de administrador incorrectas.'
    }
  } catch (error) {
    console.error('Error en el inicio de sesión del admin:', error)
    adminLoginError.value = 'Error al iniciar sesión.'
  }
}

const submitAdminAction = async () => {
  try {
    // Limpiar errores previos
    projectStore.clearError()

    // Validar acción seleccionada
    if (!currentAdminAction.value) {
      alert('Por favor, selecciona una acción.')
      return
    }

    // Validar formulario
    if (!validateAdminProject()) {
      return
    }

    isSubmittingAdmin.value = true

    const projectData = {
      name: adminProject.value.name.trim(),
      description: adminProject.value.description.trim(),
      imageUrl: adminProject.value.imageUrl.trim() || null,
      projectUrl: adminProject.value.projectUrl.trim() || null,
      technologies: adminProject.value.technologiesInput
        ? adminProject.value.technologiesInput
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [],
    }

    switch (currentAdminAction.value) {
      case 'POST':
        await projectStore.createAdminProject(
          projectData,
          adminCredentials.value.username,
          adminCredentials.value.password,
        )
        alert('¡Proyecto de administrador creado con éxito!')
        break

      case 'PUT':
        await projectStore.updateAdminProject(
          adminProject.value.id,
          projectData,
          adminCredentials.value.username,
          adminCredentials.value.password,
        )
        alert('¡Proyecto de administrador actualizado con éxito!')
        break

      case 'DELETE':
        const confirmDelete = confirm(
          `¿Estás seguro de que quieres eliminar el proyecto con ID ${adminProject.value.id}?`,
        )
        if (!confirmDelete) return

        await projectStore.deleteAdminProject(
          adminProject.value.id,
          adminCredentials.value.username,
          adminCredentials.value.password,
        )
        alert('¡Proyecto de administrador eliminado con éxito!')
        break

      default:
        alert('Acción no válida.')
        return
    }

    resetAdminPanel()
    await projectStore.fetchAllProjects()
  } catch (error) {
    console.error('Error en la acción de administrador:', error)

    let errorMessage = 'Error desconocido'
    if (error.message) {
      errorMessage = error.message
    } else if (projectStore.error) {
      errorMessage = projectStore.error
    }

    alert(`Error al realizar acción de administrador: ${errorMessage}`)
  } finally {
    isSubmittingAdmin.value = false
  }
}

// --- Funciones auxiliares ---
const closeGuestForm = () => {
  showGuestForm.value = false
  resetGuestForm()
}

const closeAdminLogin = () => {
  showAdminLogin.value = false
  adminLoginError.value = null
  adminCredentials.value = { username: '', password: '' }
}

const logoutAdmin = () => {
  isAdminLoggedIn.value = false
  resetAdminPanel()
  adminCredentials.value = { username: '', password: '' } // Clear credentials on logout
}

const selectAdminAction = (action) => {
  currentAdminAction.value = action
  adminFormErrors.value = {}

  // Limpiar campos específicos según la acción
  if (action === 'POST') {
    adminProject.value.id = null
    adminProject.value.name = ''
    adminProject.value.description = ''
    adminProject.value.imageUrl = ''
    adminProject.value.projectUrl = ''
    adminProject.value.technologiesInput = ''
  } else if (action === 'PUT') {
    // Puedes precargar datos aquí si tuvieras un proyecto a editar
    adminProject.value.name = ''
    adminProject.value.description = ''
    adminProject.value.imageUrl = ''
    adminProject.value.projectUrl = ''
    adminProject.value.technologiesInput = ''
  } else if (action === 'DELETE') {
    adminProject.value.name = ''
    adminProject.value.description = ''
    adminProject.value.imageUrl = ''
    adminProject.value.projectUrl = ''
    adminProject.value.technologiesInput = ''
  }
}

// --- Funciones para mostrar/ocultar tooltips ---
const showTooltip = (type) => {
  if (type === 'guest') {
    showGuestTooltip.value = true
    setTimeout(() => (showGuestTooltip.value = false), 3000)
  } else if (type === 'admin') {
    showAdminTooltip.value = true
    setTimeout(() => (showAdminTooltip.value = false), 3000)
  }
}
</script>

<style scoped>
/* Estilos Base */
.home-view {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 1200px;
  margin: 30px auto;
  padding: 30px;
  background-color: #f0f2f5;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  color: #333;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 2.8em;
  font-weight: 700;
  letter-spacing: -0.5px;
}

/* Botones de Cabecera */
.header-buttons {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.header-buttons button {
  background-color: #007bff;
  color: white;
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
}

.header-buttons button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 123, 255, 0.3);
}

.tooltip {
  position: absolute;
  top: calc(100% + 10px);
  background-color: rgba(44, 62, 80, 0.95);
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  white-space: nowrap;
  z-index: 100;
  font-size: 0.9em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.3s ease,
    visibility 0.3s ease;
}

.header-buttons button:hover + .tooltip {
  opacity: 1;
  visibility: visible;
}

/* Estilo del Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background-color: white;
  padding: 35px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
  max-width: 550px;
  width: 90%;
  position: relative;
  animation: fadeIn 0.3s ease-out;
}

.modal-content h2 {
  margin-top: 0;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 25px;
  font-size: 2em;
}

.modal-content form {
  display: flex;
  flex-direction: column;
}

.modal-content label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
  font-size: 0.95em;
}

.modal-content input[type='text'],
.modal-content input[type='url'],
.modal-content input[type='number'],
.modal-content input[type='password'],
.modal-content textarea {
  padding: 12px;
  margin-bottom: 20px;
  border: 1px solid #c0c0c0;
  border-radius: 6px;
  font-size: 1em;
  width: calc(100% - 24px); /* Ajuste por padding y borde */
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.modal-content input:focus,
.modal-content textarea:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
  outline: none;
}

.modal-content button {
  background-color: #28a745;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 15px;
  font-size: 1.05em;
  font-weight: 600;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
}

.modal-content button:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.modal-content button[type='button'] {
  /* Botón Cancelar */
  background-color: #6c757d;
  margin-left: 10px;
}
.modal-content button[type='button']:hover {
  background-color: #5a6268;
}

.modal-content button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* Panel de Administrador */
/* Panel de Administrador */
.admin-panel {
  background-color: #e6f7ff;
  padding: 30px;
  border-radius: 12px;
  margin-top: 40px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #b3e0ff;
}

.admin-panel h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 2.2em;
}

.admin-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.admin-actions button {
  background-color: #17a2b8;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 3px 6px rgba(23, 162, 184, 0.2);
}

.admin-actions button:hover {
  background-color: #138496;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
}

.admin-actions button.active-action {
  background-color: #007bff; /* Resalta la acción activa */
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

.admin-actions .logout-button {
  background-color: #dc3545;
}

.admin-actions .logout-button:hover {
  background-color: #c82333;
}

.admin-form {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  max-width: 800px;
  margin: 0 auto;
}

.admin-form label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
  display: block;
}

/* Grid para organizar los campos del formulario */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group-full {
  grid-column: 1 / -1;
}

.admin-form input,
.admin-form textarea {
  padding: 12px;
  border: 1px solid #c0c0c0;
  border-radius: 6px;
  font-size: 1em;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

.admin-form textarea {
  min-height: 100px;
  resize: vertical;
}

.admin-form input:focus,
.admin-form textarea:focus {
  border-color: #17a2b8;
  box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.2);
  outline: none;
}


.form-actions {
  display: flex;
  gap: 60px;
  justify-content: center;
  margin-top: 60px;
  padding: 50px 20px 20px 20px;
  border-top: 1px solid #eee;
}

.admin-form button {
  background-color: #6f42c1; /* Púrpura para acciones de admin */
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.05em;
  font-weight: 600;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
  min-width: 180px;
}

.admin-form button:hover {
  background-color: #59359e;
  transform: translateY(-1px);
}

.admin-form button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.admin-form button[type='button'] {
  background-color: #6c757d;
}

.admin-form button[type='button']:hover {
  background-color: #5a6268;
}

/* Responsive para pantallas pequeñas */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  
.form-actions {
  display: flex;
  gap: 60px;
  justify-content: center;
  margin-top: 60px;
  padding: 50px 20px 20px 20px;
  border-top: 1px solid #eee;
}
  
  .admin-form button {
    width: 100%;
    max-width: 300px;
  }
}

/* Lista de Proyectos */
.project-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  margin-top: 40px;
}

.project-card {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  overflow: hidden; /* Asegura que el contenido se mantenga dentro de las esquinas redondeadas */
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.project-card h3 {
  color: #007bff;
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.8em;
  font-weight: 600;
}

.project-card .description {
  color: #666;
  font-size: 0.95em;
  margin-bottom: 15px;
  line-height: 1.6;
  flex-grow: 1; /* Permite que la descripción tome el espacio disponible */
}

.project-image {
  max-width: 100%;
  height: 200px; /* Altura fija para tarjetas consistentes */
  object-fit: cover; /* Cubre el área, recorta si es necesario */
  border-radius: 8px;
  margin-top: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.project-card a {
  color: #007bff;
  text-decoration: none;
  font-weight: 600;
  padding: 8px 15px;
  border: 1px solid #007bff;
  border-radius: 6px;
  display: inline-block;
  margin-top: 10px;
  transition: all 0.3s ease;
}

.project-card a:hover {
  background-color: #007bff;
  color: white;
  text-decoration: none;
  transform: translateY(-1px);
}

.technologies {
  margin-top: 15px;
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.tech-tag {
  display: inline-block;
  background-color: #e9ecef;
  color: #495057;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.project-footer {
  margin-top: auto; /* Empuja el contenido hacia abajo */
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.project-type {
  font-style: italic;
  font-size: 0.8em;
  color: #888;
  margin-bottom: 5px;
}

.project-created {
  font-size: 0.7em;
  color: #aaa;
}

/* Mensajes */
.error-message {
  color: #dc3545;
  font-weight: 600;
  text-align: center;
  margin-top: 15px;
  padding: 10px;
  background-color: #ffe6e6;
  border: 1px solid #dc3545;
  border-radius: 8px;
}

.loading-message,
.no-projects-message {
  text-align: center;
  color: #555;
  font-size: 1.2em;
  margin-top: 30px;
  padding: 20px;
  background-color: #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Animaciones */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
