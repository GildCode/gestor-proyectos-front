import { createApp } from 'vue';
import { createPinia } from 'pinia'; // Importar createPinia
import App from './App.vue';
import router from './router';
import './styles.css'; // Importa tus estilos globales aquí

const app = createApp(App);
const pinia = createPinia(); // Crear instancia de Pinia

app.use(pinia); // Usar Pinia
app.use(router);
app.mount('#app');
