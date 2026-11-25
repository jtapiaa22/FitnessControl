import { contextBridge, ipcRenderer } from 'electron'
import { CANALES, type FitnessApi } from '@shared/api'

const api: FitnessApi = {
  alumnos: {
    listar: (opciones) => ipcRenderer.invoke(CANALES.alumnosListar, opciones),
    obtener: (id) => ipcRenderer.invoke(CANALES.alumnosObtener, id),
    crear: (datos) => ipcRenderer.invoke(CANALES.alumnosCrear, datos),
    actualizar: (id, cambios) => ipcRenderer.invoke(CANALES.alumnosActualizar, id, cambios),
    eliminar: (id) => ipcRenderer.invoke(CANALES.alumnosEliminar, id)
  },
  controles: {
    listarPorAlumno: (alumnoId) => ipcRenderer.invoke(CANALES.controlesListar, alumnoId),
    crear: (datos) => ipcRenderer.invoke(CANALES.controlesCrear, datos),
    actualizar: (id, cambios) => ipcRenderer.invoke(CANALES.controlesActualizar, id, cambios),
    eliminar: (id) => ipcRenderer.invoke(CANALES.controlesEliminar, id)
  }
}

contextBridge.exposeInMainWorld('api', api)
