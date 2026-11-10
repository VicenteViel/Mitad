export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      evidencias: {
        Row: {
          gasto_id: string | null
          grupo_id: string
          id: string
          liquidacion_id: string | null
          ruta: string
          subida_en: string
          subida_por: string
        }
        Insert: {
          gasto_id?: string | null
          grupo_id: string
          id?: string
          liquidacion_id?: string | null
          ruta: string
          subida_en?: string
          subida_por: string
        }
        Update: {
          gasto_id?: string | null
          grupo_id?: string
          id?: string
          liquidacion_id?: string | null
          ruta?: string
          subida_en?: string
          subida_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_gasto_id_fkey"
            columns: ["gasto_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencias_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencias_subida_por_fkey"
            columns: ["subida_por"]
            isOneToOne: false
            referencedRelation: "integrantes"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          borrado_en: string | null
          borrado_por: string | null
          categoria: string
          clave_idempotencia: string
          creado_en: string
          creado_por: string
          descripcion: string
          editado_en: string | null
          editado_por: string | null
          fecha: string
          grupo_id: string
          id: string
          monto: number
          pagado_por: string
          tipo_division: string
          version: number
        }
        Insert: {
          borrado_en?: string | null
          borrado_por?: string | null
          categoria: string
          clave_idempotencia: string
          creado_en?: string
          creado_por: string
          descripcion: string
          editado_en?: string | null
          editado_por?: string | null
          fecha?: string
          grupo_id: string
          id?: string
          monto: number
          pagado_por: string
          tipo_division: string
          version?: number
        }
        Update: {
          borrado_en?: string | null
          borrado_por?: string | null
          categoria?: string
          clave_idempotencia?: string
          creado_en?: string
          creado_por?: string
          descripcion?: string
          editado_en?: string | null
          editado_por?: string | null
          fecha?: string
          grupo_id?: string
          id?: string
          monto?: number
          pagado_por?: string
          tipo_division?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "gastos_borrado_por_fkey"
            columns: ["borrado_por"]
            isOneToOne: false
            referencedRelation: "integrantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "integrantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_editado_por_fkey"
            columns: ["editado_por"]
            isOneToOne: false
            referencedRelation: "integrantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_pagado_por_fkey"
            columns: ["pagado_por"]
            isOneToOne: false
            referencedRelation: "integrantes"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          creado_en: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          creado_en?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          creado_en?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      integrantes: {
        Row: {
          alias: string | null
          avatar: string
          color: string
          grupo_id: string
          id: string
          nombre: string
          rol: string
          salio_en: string | null
          unido_en: string
          usuario_id: string | null
        }
        Insert: {
          alias?: string | null
          avatar: string
          color: string
          grupo_id: string
          id?: string
          nombre: string
          rol?: string
          salio_en?: string | null
          unido_en?: string
          usuario_id?: string | null
        }
        Update: {
          alias?: string | null
          avatar?: string
          color?: string
          grupo_id?: string
          id?: string
          nombre?: string
          rol?: string
          salio_en?: string | null
          unido_en?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrantes_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      invitaciones: {
        Row: {
          creada_en: string
          creada_por: string
          expira_en: string
          grupo_id: string
          id: string
          integrante_id: string | null
          revocada_en: string | null
          token_hash: string
          usada_en: string | null
          usada_por: string | null
        }
        Insert: {
          creada_en?: string
          creada_por: string
          expira_en?: string
          grupo_id: string
          id?: string
          integrante_id?: string | null
          revocada_en?: string | null
          token_hash: string
          usada_en?: string | null
          usada_por?: string | null
        }
        Update: {
          creada_en?: string
          creada_por?: string
          expira_en?: string
          grupo_id?: string
          id?: string
          integrante_id?: string | null
          revocada_en?: string | null
          token_hash?: string
          usada_en?: string | null
          usada_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitaciones_creada_por_fkey"
            columns: ["creada_por"]
            isOneToOne: false
            referencedRelation: "integrantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitaciones_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitaciones_integrante_id_fkey"
            columns: ["integrante_id"]
            isOneToOne: false
            referencedRelation: "integrantes"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidaciones: {
        Row: {
          a: string
          borrado_en: string | null
          borrado_por: string | null
          clave_idempotencia: string
          creado_en: string
          de: string
          declarada_por: string
          editado_en: string | null
          editado_por: string | null
          fecha: string
          grupo_id: string
          id: string
          monto: number
          version: number
        }
        Insert: {
          a: string
          borrado_en?: string | null
          borrado_por?: string | null
          clave_idempotencia: string
          creado_en?: string
          de: string
          declarada_por: string
          editado_en?: string | null
          editado_por?: string | null
          fecha?: string
          grupo_id: string
          id?: string
          monto: number
          version?: number
        }
        Update: {
          a?: string
          borrado_en?: string | null
          borrado_por?: string | null
          clave_idempotencia?: string
          creado_en?: string
          de?: string
          declarada_por?: string
          editado_en?: string | null
          editado_por?: string | null
          fecha?: string
          grupo_id?: string
          id?: string
          monto?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "liquidaciones_a_fkey"
            columns: ["a"]
            isOneToOne: false
            referencedRelation: "integrantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidaciones_de_fkey"
            columns: ["de"]
            isOneToOne: false
            referencedRelation: "integrantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidaciones_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      participaciones: {
        Row: {
          gasto_id: string
          integrante_id: string
          monto: number
        }
        Insert: {
          gasto_id: string
          integrante_id: string
          monto: number
        }
        Update: {
          gasto_id?: string
          integrante_id?: string
          monto?: number
        }
        Relationships: [
          {
            foreignKeyName: "participaciones_gasto_id_fkey"
            columns: ["gasto_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participaciones_integrante_id_fkey"
            columns: ["integrante_id"]
            isOneToOne: false
            referencedRelation: "integrantes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aceptar_invitacion: { Args: { p_codigo: string }; Returns: Json }
      actualizar_alias: {
        Args: { p_alias: string; p_grupo_id: string }
        Returns: undefined
      }
      agregar_integrantes: {
        Args: { p_grupo_id: string; p_integrantes: Json }
        Returns: number
      }
      anonimizar_usuario: {
        Args: { p_usuario_id: string }
        Returns: undefined
      }
      borrar_evidencia: { Args: { p_evidencia_id: string }; Returns: string }
      cambiar_apariencia: {
        Args: { p_avatar: string; p_color: string; p_integrante_id: string }
        Returns: undefined
      }
      cambiar_rol: {
        Args: { p_integrante_id: string; p_rol: string }
        Returns: undefined
      }
      crear_invitacion: { Args: { p_integrante_id: string }; Returns: string }
      editar_gasto: {
        Args: {
          p_categoria: string
          p_descripcion: string
          p_gasto_id: string
          p_monto: number
          p_pagado_por: string
          p_participantes: Json
          p_tipo_division: string
          p_version: number
        }
        Returns: number
      }
      editar_grupo: {
        Args: { p_descripcion: string; p_grupo_id: string; p_nombre: string }
        Returns: undefined
      }
      editar_liquidacion: {
        Args: {
          p_a: string
          p_de: string
          p_liquidacion_id: string
          p_monto: number
          p_version: number
        }
        Returns: number
      }
      eliminar_gasto: { Args: { p_gasto_id: string }; Returns: undefined }
      eliminar_liquidacion: {
        Args: { p_liquidacion_id: string }
        Returns: undefined
      }
      es_admin: { Args: { p_grupo_id: string }; Returns: boolean }
      es_integrante: { Args: { p_grupo_id: string }; Returns: boolean }
      hash_codigo_invitacion: { Args: { p_codigo: string }; Returns: string }
      iniciar_grupo: {
        Args: {
          p_avatar: string
          p_color: string
          p_descripcion: string
          p_integrantes: Json
          p_nombre: string
          p_nombre_integrante: string
        }
        Returns: string
      }
      quitar_integrante: {
        Args: { p_integrante_id: string }
        Returns: undefined
      }
      registrar_evidencia: {
        Args: { p_gasto_id: string; p_ruta: string }
        Returns: string
      }
      registrar_evidencia_liquidacion: {
        Args: { p_liquidacion_id: string; p_ruta: string }
        Returns: string
      }
      registrar_gasto: {
        Args: {
          p_categoria: string
          p_clave_idempotencia: string
          p_descripcion: string
          p_fecha: string
          p_grupo_id: string
          p_monto: number
          p_pagado_por: string
          p_participantes: Json
          p_tipo_division: string
        }
        Returns: string
      }
      registrar_liquidacion: {
        Args: {
          p_a: string
          p_clave_idempotencia: string
          p_de: string
          p_fecha: string
          p_grupo_id: string
          p_monto: number
        }
        Returns: string
      }
      salir_del_grupo: { Args: { p_grupo_id: string }; Returns: undefined }
      tomar_admin: { Args: { p_grupo_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
