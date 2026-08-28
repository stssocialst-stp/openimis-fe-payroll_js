import { useState } from 'react';
import { baseApiUrl } from '@stssocialst-stp/fe-core';

const BASE = `${baseApiUrl}/payroll/beneficiarios`;

function buildHeaders() {
  return { 'Content-Type': 'application/json' };
}

export function useBeneficiarios() {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);

  async function request(path, { multipart = false, body = null } = {}) {
    setLoading(true);
    setError(null);
    try {
      const init = {
        method: 'POST',
        credentials: 'same-origin',
      };
      if (multipart) {
        init.body = body;
      } else {
        init.headers = buildHeaders();
        if (body) init.body = JSON.stringify(body);
      }
      const response = await fetch(`${BASE}${path}`, init);
      let data = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      }
      if (!response.ok) {
        const message = data?.message || `HTTP ${response.status}`;
        setError(message);
        return { ok: false, message, data };
      }
      return { ok: true, data };
    } catch (e) {
      setError(e.message);
      return { ok: false, message: e.message };
    } finally {
      setLoading(false);
    }
  }

  async function backup(payrollId = null) {
    const { ok, data } = await request('/backup/', {
      body: payrollId ? { payroll_id: payrollId } : {},
    });
    if (ok) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `backup_beneficiarios_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      setOutput(`Backup concluído: ${JSON.stringify(data.counts)}`);
    }
    return { ok, data };
  }

  async function limpar({ dryRun = true, forceSkipFinancial = false } = {}) {
    const { ok, data } = await request('/limpar/', {
      body: { username: 'admin', dry_run: dryRun, force_skip_financial: forceSkipFinancial },
    });
    if (ok) setOutput(data.output);
    return { ok, data };
  }

  async function importar(
    file,
    { dryRun = false, payrollId, benefitPlanId, benefitType, sheet } = {},
  ) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('username', 'admin');
    fd.append('dry_run', String(dryRun));
    if (payrollId) fd.append('payroll_id', payrollId);
    if (benefitPlanId) fd.append('benefit_plan_id', benefitPlanId);
    if (benefitType) fd.append('benefit_type', benefitType);
    if (sheet) fd.append('sheet', sheet);
    const { ok, data } = await request('/importar/', { multipart: true, body: fd });
    if (ok) setOutput(data.output);
    return { ok, data };
  }

  async function restore(file, { dryRun = true, skipPhases = [] } = {}) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('username', 'admin');
    fd.append('dry_run', String(dryRun));
    if (skipPhases.length) fd.append('skip_phases', skipPhases.join(','));
    const { ok, data } = await request('/restore/', { multipart: true, body: fd });
    if (ok) setOutput(data.output);
    return { ok, data };
  }

  return {
    backup, limpar, importar, restore, loading, output, error, setOutput, setError,
  };
}
