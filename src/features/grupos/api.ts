import { supabase } from '@/lib/supabase'

export type NuevoGrupo = {
  nombre: string
  descripcion?: string
  nombreIntegrante: string
};

export async function crearGrupo(datos: NuevoGrupo): Promise<string> {
    const { data, error } = await supabase.rpc('crear_grupo', {
        p_nombre: datos.nombre,
        p_descripcion: datos.descripcion ?? '',
        p_nombre_integrante: datos.nombreIntegrante
    });

    if (error) {
        throw new Error(`Error al crear el grupo: ${error.message}`);
    }

    return data;
}