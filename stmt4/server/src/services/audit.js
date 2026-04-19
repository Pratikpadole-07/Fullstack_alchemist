import { AuditLog } from '../models/AuditLog.js';

export async function recordAudit({ actor, action, resource, metadata, ip }) {
  await AuditLog.create({
    actor: actor || null,
    action,
    resource: resource || '',
    metadata: metadata || {},
    ip: ip || '',
  });
}
