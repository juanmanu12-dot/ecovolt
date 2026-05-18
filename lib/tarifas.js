import { supabase } from './supabase'

export async function getTarifaEmpresa(empresa: string, tipoActivos: string): Promise<number> {
  const { data, error } = await supabase
    .from('tarifas_energia')
    .select('tarifa_final')
    .eq('empresa', empresa)
    .eq('tipo', 'comercial')
    .eq('subtipo', tipoActivos)
    .single()

  console.log('Tarifa empresa:', empresa, tipoActivos, data, error)
  return data?.tarifa_final || 1141
}

export async function getTarifaHogar(empresa: string, estrato: number): Promise<number> {
  const subtipo = `estrato_${estrato}`
  const { data, error } = await supabase
    .from('tarifas_energia')
    .select('tarifa_final')
    .eq('empresa', empresa)
    .eq('tipo', 'residencial')
    .eq('subtipo', subtipo)
    .single()

  console.log('Tarifa hogar:', empresa, subtipo, data, error)
  return data?.tarifa_final || 821
}

export async function getInfoTarifaHogar(empresa: string, estrato: number) {
  const subtipo = `estrato_${estrato}`
  const { data } = await supabase
    .from('tarifas_energia')
    .select('*')
    .eq('empresa', empresa)
    .eq('tipo', 'residencial')
    .eq('subtipo', subtipo)
    .single()
  return data
}

export async function getInfoTarifaEmpresa(empresa: string, tipoActivos: string) {
  const { data } = await supabase
    .from('tarifas_energia')
    .select('*')
    .eq('empresa', empresa)
    .eq('tipo', 'comercial')
    .eq('subtipo', tipoActivos)
    .single()
  return data
}

export function formatCOP(n: number): string {
  return 'COP $' + Math.round(n).toLocaleString('es-CO')
}
