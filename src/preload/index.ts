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
  },
  configuracion: {
    obtener: () => ipcRenderer.invoke(CANALES.configuracionObtener),
    guardar: (cambios) => ipcRenderer.invoke(CANALES.configuracionGuardar, cambios)
  },
  backup: {
    carpeta: () => ipcRenderer.invoke(CANALES.backupCarpeta),
    elegirCarpeta: () => ipcRenderer.invoke(CANALES.backupElegirCarpeta),
    hacerCopia: () => ipcRenderer.invoke(CANALES.backupHacerCopia),
    abrirCarpeta: () => ipcRenderer.invoke(CANALES.backupAbrirCarpeta),
    elegirCopia: () => ipcRenderer.invoke(CANALES.backupElegirCopia),
    restaurar: (ruta) => ipcRenderer.invoke(CANALES.backupRestaurar, ruta)
  },
  reporte: {
    guardarPdf: (datos) => ipcRenderer.invoke(CANALES.reporteGuardarPdf, datos),
    historial: (alumnoId) => ipcRenderer.invoke(CANALES.reporteHistorial, alumnoId),
    abrir: (id) => ipcRenderer.invoke(CANALES.reporteAbrir, id),
    mostrarEnCarpeta: (id) => ipcRenderer.invoke(CANALES.reporteMostrar, id),
    enviarPorWhatsApp: (id) => ipcRenderer.invoke(CANALES.reporteWhatsApp, id),
    quitar: (id) => ipcRenderer.invoke(CANALES.reporteQuitar, id)
  }
}

contextBridge.exposeInMainWorld('api', api)
