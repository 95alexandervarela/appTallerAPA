export type TicketStatusSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
export type TicketStatusGroup =
  | 'nuevo'
  | 'pendiente'
  | 'diagnostico'
  | 'garantia'
  | 'repuesto'
  | 'reparacion'
  | 'entrega'
  | 'cerrado'
  | 'excepcion';

export interface TicketStatusDefinition {
  code: string;
  label: string;
  globalStatus: string;
  className: string;
  severity: TicketStatusSeverity;
  group: TicketStatusGroup;
  description: string;
  order: number;
}

function status(
  code: string,
  label: string,
  globalStatus: string,
  group: TicketStatusGroup,
  severity: TicketStatusSeverity,
  description: string,
  order: number,
): TicketStatusDefinition {
  return {
    code,
    label,
    globalStatus,
    className: `status-badge status-badge--${globalStatus.replace(/_/g, '-')}`,
    severity,
    group,
    description,
    order,
  };
}

export const TICKET_STATUS_CATALOG: Record<string, TicketStatusDefinition> = {
  creado: status('creado', 'Creado', 'creado', 'nuevo', 'success', 'Ticket registrado en el sistema.', 10),
  asignado: status('asignado', 'Asignado', 'asignado', 'pendiente', 'info', 'Ticket asignado a un tecnico.', 20),
  en_diagnostico: status('en_diagnostico', 'En diagnostico', 'en_diagnostico', 'diagnostico', 'info', 'Equipo en revision tecnica.', 30),
  diagnostico: status('diagnostico', 'Diagnostico', 'en_diagnostico', 'diagnostico', 'info', 'Diagnostico tecnico registrado.', 31),
  diagnosticado: status('diagnosticado', 'Diagnosticado', 'en_diagnostico', 'diagnostico', 'info', 'Diagnostico tecnico completado.', 32),
  pendiente_aprobacion: status('pendiente_aprobacion', 'Pendiente aprobacion', 'pendiente_aprobacion', 'garantia', 'warn', 'Pendiente de autorizacion o garantia.', 40),
  pendiente_autorizacion_garantia: status(
    'pendiente_autorizacion_garantia',
    'Pendiente autorizacion',
    'pendiente_aprobacion',
    'garantia',
    'warn',
    'Pendiente de respuesta del cliente o garantia.',
    41,
  ),
  garantia_aprobada: status('garantia_aprobada', 'Garantia aprobada', 'pendiente_aprobacion', 'garantia', 'success', 'Garantia aprobada para continuar.', 42),
  reparacion_autorizada: status('reparacion_autorizada', 'Reparacion autorizada', 'listo_para_reparacion', 'garantia', 'success', 'Cliente autorizo la reparacion.', 43),
  reparacion_no_autorizada: status('reparacion_no_autorizada', 'No autorizado', 'cancelado', 'garantia', 'danger', 'Reparacion no autorizada.', 44),
  pendiente_repuesto: status('pendiente_repuesto', 'Pendiente repuesto', 'espera_repuesto', 'repuesto', 'warn', 'Repuesto pendiente de gestion.', 50),
  espera_repuesto: status('espera_repuesto', 'Espera repuesto', 'espera_repuesto', 'repuesto', 'warn', 'Ticket esperando repuesto.', 51),
  pendiente_cotizacion: status('pendiente_cotizacion', 'Pendiente cotizacion', 'espera_repuesto', 'repuesto', 'warn', 'Repuesto pendiente de cotizacion.', 52),
  repuesto_solicitado_apa: status('repuesto_solicitado_apa', 'Repuesto solicitado', 'espera_repuesto', 'repuesto', 'warn', 'Repuesto solicitado a APA o proveedor.', 53),
  repuesto_disponible: status('repuesto_disponible', 'Repuesto disponible', 'reparado', 'repuesto', 'success', 'Repuesto disponible para tecnico.', 54),
  listo_reparacion: status('listo_reparacion', 'Listo reparacion', 'listo_para_reparacion', 'reparacion', 'success', 'Equipo listo para iniciar reparacion.', 60),
  listo_para_reparacion: status('listo_para_reparacion', 'Listo para reparacion', 'listo_para_reparacion', 'reparacion', 'success', 'Equipo listo para reparacion.', 61),
  en_reparacion: status('en_reparacion', 'En reparacion', 'en_reparacion', 'reparacion', 'info', 'Equipo en reparacion.', 70),
  reparado_servicio_finalizado: status('reparado_servicio_finalizado', 'Reparado', 'reparado', 'reparacion', 'success', 'Reparacion finalizada.', 80),
  validado_tecnicamente: status('validado_tecnicamente', 'Validado tecnicamente', 'reparado', 'reparacion', 'success', 'Equipo validado tecnicamente.', 81),
  listo_cobro_entrega: status('listo_cobro_entrega', 'Listo cobro / entrega', 'listo_entrega', 'entrega', 'success', 'Equipo listo para cobro o entrega.', 90),
  pendiente_cliente: status('pendiente_cliente', 'Pendiente cliente', 'pendiente_aprobacion', 'pendiente', 'warn', 'Pendiente de comunicacion con cliente.', 91),
  pendiente_cobro_cierre: status('pendiente_cobro_cierre', 'Pendiente cobro', 'pendiente_aprobacion', 'pendiente', 'warn', 'Pendiente de cobro para cierre.', 92),
  listo_entrega: status('listo_entrega', 'Listo entrega', 'listo_entrega', 'entrega', 'success', 'Equipo listo para entregar.', 100),
  pendiente_cobro_entrega: status('pendiente_cobro_entrega', 'Pendiente cobro entrega', 'pendiente_aprobacion', 'pendiente', 'warn', 'Pendiente de cobro antes de entrega.', 101),
  entregado: status('entregado', 'Entregado', 'cerrado', 'cerrado', 'success', 'Equipo entregado al cliente.', 110),
  cerrado: status('cerrado', 'Cerrado', 'cerrado', 'cerrado', 'success', 'Ticket cerrado.', 120),
  cancelado: status('cancelado', 'Cancelado', 'cancelado', 'cerrado', 'danger', 'Ticket cancelado.', 130),
  en_excepcion: status('en_excepcion', 'Excepcion', 'en_excepcion', 'excepcion', 'danger', 'Ticket en excepcion operativa.', 140),
};

/**
 * Diccionario central de estados visibles del ticket.
 *
 * Mantiene etiqueta, clase visual y orden en un solo lugar. Las vistas no usan
 * colores hardcodeados ni `p-tag` para estados, solo `className`.
 */
export function getTicketStatusDefinition(statusCode: string | null | undefined): TicketStatusDefinition {
  const normalizedStatus = statusCode || 'desconocido';

  return (
    TICKET_STATUS_CATALOG[normalizedStatus] ??
    status(normalizedStatus, formatUnknownTicketStatus(normalizedStatus), 'fallback', 'excepcion', 'secondary', 'Estado no mapeado.', 999)
  );
}

export function getTicketStatusLabel(statusCode: string | null | undefined): string {
  return getTicketStatusDefinition(statusCode).label;
}

export function getTicketStatusClassName(statusCode: string | null | undefined): string {
  return getTicketStatusDefinition(statusCode).className;
}

export function getTicketStatusSeverity(statusCode: string | null | undefined): TicketStatusSeverity {
  return getTicketStatusDefinition(statusCode).severity;
}

export function isTicketStatusInGroup(statusCode: string | null | undefined, groups: TicketStatusGroup[]): boolean {
  return groups.includes(getTicketStatusDefinition(statusCode).group);
}

export function isOpenTicketStatus(statusCode: string | null | undefined): boolean {
  return !isTicketStatusInGroup(statusCode, ['cerrado']);
}

function formatUnknownTicketStatus(statusCode: string): string {
  return (
    statusCode
      .split('_')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Desconocido'
  );
}
