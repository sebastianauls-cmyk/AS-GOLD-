// One renderer handles real Unicode markers before pagination. Sentinel
// patching after pagination could split markers and expose internal tokens.
export { OFFICE_EXPORT_RENDER_VERSION, createPptxBlob, createXlsxBlob } from './officeExports.js'
