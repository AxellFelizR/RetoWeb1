import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user, token) => set({
        user,
        token,
        isAuthenticated: !!token
      }),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),

      updateUser: (updates) => set((state) => ({
        user: { ...state.user, ...updates }
      }))
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Tienda para solicitudes
export const useSolicitudStore = create((set) => ({
  solicitudes: [],
  loading: false,
  error: null,

  setSolicitudes: (solicitudes) => set({ solicitudes }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addSolicitud: (solicitud) => set((state) => ({
    solicitudes: [solicitud, ...state.solicitudes]
  })),

  updateSolicitud: (id, updates) => set((state) => ({
    solicitudes: state.solicitudes.map(s =>
      s.id_solicitud === id ? { ...s, ...updates } : s
    )
  }))
}))

// Tienda para archivos
export const useArchivoStore = create((set) => ({
  archivos: [],
  uploading: false,

  setArchivos: (archivos) => set({ archivos }),
  setUploading: (uploading) => set({ uploading }),

  addArchivo: (archivo) => set((state) => ({
    archivos: [...state.archivos, archivo]
  })),

  removeArchivo: (id) => set((state) => ({
    archivos: state.archivos.filter(a => a.id_archivo !== id)
  }))
}))
