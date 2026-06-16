// Catálogo de documentos colombianos por tipo de solicitud
// Basado en normatividad: Ley 80/93, Ley 1150/07, Decreto 1082/15, Decreto 1273/2018, Art. 616-1 E.T.

export const CATALOGO_DOCS = {
  precontractual: [
    // — Identificación —
    { nombre: 'RUT actualizado',                              base_legal: 'Art. 616-1 E.T. · Vigencia 30 días' },
    { nombre: 'Cédula de ciudadanía (persona natural)',       base_legal: 'Identificación personal' },
    { nombre: 'Cédula de extranjería (si aplica)',            base_legal: 'Migración Colombia' },
    { nombre: 'NIT (persona jurídica)',                       base_legal: 'DIAN · Identificación tributaria' },
    { nombre: 'Certificado de existencia y representación',   base_legal: 'Cámara de Comercio · Máx. 30 días' },
    { nombre: 'Escritura de constitución / estatutos sociales', base_legal: 'Art. 98 C. de Co.' },
    { nombre: 'Acta junta directiva — autorización representante legal', base_legal: 'Estatutos sociales' },
    { nombre: 'Tarjeta profesional (según profesión)',        base_legal: 'Ley habilitante del gremio' },
    { nombre: 'Licencia de funcionamiento',                   base_legal: 'Ley 232/1995' },
    // — Inhabilidades e impedimentos —
    { nombre: 'Consulta inhabilidades SIRI',                  base_legal: 'Art. 8 Ley 80/93 · Procuraduría' },
    { nombre: 'Consulta inhabilidades Contraloría',           base_legal: 'Art. 8 Ley 80/93 · Contraloría GR' },
    { nombre: 'Certificado antecedentes judiciales',          base_legal: 'Policía Nacional' },
    { nombre: 'Certificado antecedentes disciplinarios',      base_legal: 'SIRI Procuraduría General' },
    { nombre: 'Certificado antecedentes fiscales',            base_legal: 'Contraloría General de la República' },
    { nombre: 'Declaración juramentada de inhabilidades e incompatibilidades', base_legal: 'Art. 8 Ley 80/93' },
    // — SAGRILAFT / LAFT —
    { nombre: 'Formulario SAGRILAFT / vinculación LAFT',      base_legal: 'Circular 100-000016 SFC · Res. 314/2021' },
    { nombre: 'Declaración de beneficiarios finales',         base_legal: 'Art. 2.1.13.1.3 Decreto 1068/15 (SAGRILAFT)' },
    { nombre: 'Composición accionaria / RUT socios > 5%',     base_legal: 'SAGRILAFT · Control de estructuras' },
    { nombre: 'Consulta lista OFAC / Clinton',                base_legal: 'Control lavado de activos' },
    { nombre: 'Consulta lista ONU (Res. 1267)',               base_legal: 'Prevención financiación terrorismo' },
    { nombre: 'Consulta UIAF',                               base_legal: 'Ley 526/1999 · UIAF' },
    // — Capacidad financiera —
    { nombre: 'Estados financieros (últimos 2 años) con dictamen', base_legal: 'Art. 6 Ley 1150/07 · Decreto 1082/15' },
    { nombre: 'Balance general auditado',                     base_legal: 'Capacidad financiera Decreto 1082/15' },
    { nombre: 'Estado de resultados',                         base_legal: 'Capacidad financiera Decreto 1082/15' },
    { nombre: 'Declaración de renta último año',              base_legal: 'DIAN' },
    { nombre: 'Certificado de Revisor Fiscal (si aplica)',    base_legal: 'Art. 207 C. de Co.' },
    { nombre: 'Certificación bancaria',                       base_legal: 'Control de pagos · Vigente' },
    { nombre: 'Capacidad residual de contratación',           base_legal: 'Decreto 1082/15 Art. 2.2.1.1.2.2.1' },
    // — SECOP / Registro —
    { nombre: 'Registro de proponentes RUP (Cámara)',         base_legal: 'Decreto 1082/15 Art. 2.2.1.1.1.3.1' },
    { nombre: 'Registro de proveedores SECOP II',             base_legal: 'Decreto 1082/15' },
    { nombre: 'Clasificación UNSPSC del objeto contractual',  base_legal: 'Decreto 1082/15 · Colombia Compra' },
    // — Propuesta técnica-económica —
    { nombre: 'Carta de presentación de oferta',              base_legal: 'Art. 23 Ley 80/93' },
    { nombre: 'Propuesta técnica',                            base_legal: 'Art. 23 Ley 80/93' },
    { nombre: 'Oferta económica firmada',                     base_legal: 'Art. 23 Ley 80/93' },
    { nombre: 'Análisis de precios unitarios (APU)',          base_legal: 'Buena práctica contractual' },
    { nombre: 'Cronograma de ejecución',                      base_legal: 'Art. 23 Ley 80/93' },
    { nombre: 'Metodología propuesta',                        base_legal: 'Art. 23 Ley 80/93' },
    { nombre: 'Garantía de seriedad de la oferta',            base_legal: 'Art. 7 Ley 1150/07' },
    { nombre: 'Ficha técnica del bien / servicio ofertado',   base_legal: 'Art. 23 Ley 80/93' },
    // — Equipo de trabajo —
    { nombre: 'Hoja de vida (SIGEP)',                         base_legal: 'Decreto 468/1990' },
    { nombre: 'Diplomas y actas de grado',                    base_legal: 'Soporte académico' },
    { nombre: 'Certificados de experiencia laboral',          base_legal: 'Soporte experiencia' },
    { nombre: 'Hojas de vida equipo clave propuesto',         base_legal: 'Pliego de condiciones' },
    { nombre: 'Lista de subcontratistas (si aplica)',         base_legal: 'Art. 14 Ley 80/93' },
    // — Obligaciones legales —
    { nombre: 'Declaración de bienes y rentas',               base_legal: 'Ley 190/95 · Art. 13' },
    { nombre: 'Paz y salvo municipal / tributario',           base_legal: 'Control tributario local' },
    { nombre: 'Certificado ISO / sistema de gestión (si aplica)', base_legal: 'Requisito del pliego' },
    { nombre: 'Permiso sanitario / INVIMA (si aplica)',       base_legal: 'Ley 9/79 · Decreto 3075/97' },
    { nombre: 'Permiso ambiental / licencia (si aplica)',     base_legal: 'Ley 99/93 · Decreto 2041/14' },
  ],

  inicio: [
    { nombre: 'Póliza de cumplimiento aprobada',          base_legal: 'Art. 7 Ley 1150/07 · Decreto 1082/15' },
    { nombre: 'Póliza de responsabilidad civil',          base_legal: 'Art. 7 Ley 1150/07' },
    { nombre: 'Afiliación EPS (salud)',                   base_legal: 'Art. 23 Ley 1150/07' },
    { nombre: 'Afiliación fondo de pensiones',            base_legal: 'Art. 23 Ley 1150/07' },
    { nombre: 'Certificado ARL (clase de riesgo)',        base_legal: 'Decreto 1295/94' },
    { nombre: 'Acta de inicio firmada',                   base_legal: 'Art. 26 Ley 80/93' },
    { nombre: 'CDP vigente',                              base_legal: 'Decreto 111/1996 Art. 71' },
    { nombre: 'Registro presupuestal (RP)',               base_legal: 'Decreto 111/1996' },
    { nombre: 'Minuta del contrato firmada',              base_legal: 'Art. 39 Ley 80/93' },
    { nombre: 'Garantías aprobadas por la entidad',       base_legal: 'Decreto 1082/15 Art. 2.2.1.2.3.1.1' },
    { nombre: 'Publicación SECOP II',                     base_legal: 'Decreto 1082/15 Art. 2.2.1.1.1.5.1' },
  ],

  mensual: [
    { nombre: 'Planilla PILA (salud + pensión + ARL)',    base_legal: 'Decreto 1273/2018' },
    { nombre: 'Factura o cuenta de cobro',                base_legal: 'Art. 615 E.T. · Res. DIAN 42/2020' },
    { nombre: 'Informe de actividades del período',       base_legal: 'Art. 83 Ley 1474/2011' },
    { nombre: 'Acta de supervisión mensual',              base_legal: 'Art. 83 Ley 1474/2011' },
    { nombre: 'Registro fotográfico / evidencias',        base_legal: 'Buena práctica documental' },
    { nombre: 'Póliza vigente (actualización)',           base_legal: 'Art. 7 Ley 1150/07' },
    { nombre: 'Certificado EPS mensual',                  base_legal: 'Art. 23 Ley 1150/07' },
    { nombre: 'Certificado ARL mensual',                  base_legal: 'Decreto 1295/94' },
    { nombre: 'Paz y salvo de entidad supervisora',       base_legal: 'Art. 83 Ley 1474/2011' },
  ],

  especial: [
    { nombre: 'Acta de modificación contractual',         base_legal: 'Art. 16 Ley 80/93' },
    { nombre: 'Justificación técnica de adición',         base_legal: 'Art. 40 Ley 80/93 · Máx. 50%' },
    { nombre: 'Garantías actualizadas',                   base_legal: 'Decreto 1082/15' },
    { nombre: 'Concepto jurídico de adición',             base_legal: 'Área jurídica entidad' },
    { nombre: 'Adición presupuestal (CDP adicional)',     base_legal: 'Decreto 111/1996' },
    { nombre: 'Publicación modificación SECOP',           base_legal: 'Decreto 1082/15' },
    { nombre: 'Póliza de cumplimiento ampliada',          base_legal: 'Art. 7 Ley 1150/07' },
  ],

  cierre: [
    { nombre: 'Acta de liquidación firmada',              base_legal: 'Art. 60 Ley 80/93 · Plazo 4 meses' },
    { nombre: 'Informe final de actividades',             base_legal: 'Art. 83 Ley 1474/2011' },
    { nombre: 'Certificación de cumplimiento',            base_legal: 'Supervisor designado' },
    { nombre: 'Inventario y devolución de bienes',        base_legal: 'Buena práctica documental' },
    { nombre: 'Paz y salvo de la entidad contratante',    base_legal: 'Verificación interna' },
    { nombre: 'Póliza de estabilidad (si aplica)',        base_legal: 'Art. 7 Ley 1150/07' },
    { nombre: 'Declaración 350 retención (si aplica)',    base_legal: 'Art. 365 E.T.' },
    { nombre: 'Publicación liquidación SECOP',            base_legal: 'Decreto 1082/15' },
  ],
}

// Todos los docs en un solo array (para búsqueda global)
export const TODOS_LOS_DOCS = Object.values(CATALOGO_DOCS).flat()
  .filter((d, i, arr) => arr.findIndex(x => x.nombre === d.nombre) === i)
