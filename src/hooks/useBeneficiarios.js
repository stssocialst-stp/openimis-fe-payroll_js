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

  async function poll(clientMutationId) {
    const INTERVAL_MS = 5000;
    const TIMEOUT_MS = 20 * 60 * 1000; // 20 minutos
    const started = Date.now();

    while (Date.now() - started < TIMEOUT_MS) {
      await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));

      const resp = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: buildHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
          query: `
            query {
              mutationLogs(clientMutationId: "${clientMutationId}") {
                edges { node { status error jsonExt clientMutationLabel } }
              }
            }
          `,
        }),
      });
      const result = await resp.json();
      const node = result?.data?.mutationLogs?.edges?.[0]?.node;

      if (!node) continue;

      // Update UI with label if needed
      setOutput(`A processar: ${node.clientMutationLabel}...`);

      if (node.status === 2) return { success: true, output: node.jsonExt?.output ?? null, error: null };
      if (node.status === 1) return { success: false, output: null, error: node.error };
    }
    return { success: false, output: null, error: 'Timeout: operação excedeu 20 minutos' };
  }

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
    }
    // Note: setLoading(false) is handled after polling in methods
  }

  async function backup(payrollId = null) {
    const { ok, data } = await request('/backup/', {
      body: payrollId ? { payroll_id: payrollId } : {},
    });
    if (ok) {
      setOutput('Backup iniciado. A aguardar conclusão...');
      const pollResult = await poll(data.clientMutationId);
      if (pollResult.success) {
        setOutput(`Backup concluído: ${pollResult.output}`);
        // Handle download trigger if file info is in jsonExt
      } else {
        setError(pollResult.error);
      }
    }
    setLoading(false);
    return { ok, data };
  }

  async function limpar({ dryRun = true, forceSkipFinancial = false } = {}) {
    const { ok, data } = await request('/limpar/', {
      body: { username: 'admin', dry_run: dryRun, force_skip_financial: forceSkipFinancial },
    });
    if (ok) {
      setOutput('Limpeza iniciada. A aguardar conclusão...');
      const pollResult = await poll(data.clientMutationId);
      if (pollResult.success) {
        setOutput(pollResult.output);
      } else {
        setError(pollResult.error);
      }
    }
    setLoading(false);
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
    if (ok) {
      setOutput('Importação iniciada. A aguardar conclusão...');
      const pollResult = await poll(data.clientMutationId);
      if (pollResult.success) {
        setOutput(pollResult.output);
      } else {
        setError(pollResult.error);
      }
    }
    setLoading(false);
    return { ok, data };
  }

  async function restore(file, { dryRun = true, skipPhases = [] } = {}) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('username', 'admin');
    fd.append('dry_run', String(dryRun));
    if (skipPhases.length) fd.append('skip_phases', skipPhases.join(','));
    const { ok, data } = await request('/restore/', { multipart: true, body: fd });
    if (ok) {
      setOutput('Restore iniciado. A aguardar conclusão...');
      const pollResult = await poll(data.clientMutationId);
      if (pollResult.success) {
        setOutput(pollResult.output);
      } else {
        setError(pollResult.error);
      }
    }
    setLoading(false);
    return { ok, data };
  }

  return {
    backup, limpar, importar, restore, loading, output, error, setOutput, setError,
  };
}