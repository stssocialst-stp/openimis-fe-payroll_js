import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';
import {
  PublishedComponent,
  useModulesManager,
  useTranslations,
} from '@stssocialst-stp/fe-core';
import { MODULE_NAME, PAYMENT_METHOD, PAYROLL_STATUS } from '../../../constants';
import { updatePayrollPaymentDate, fetchPayroll } from '../../../actions';
import { mutationLabel } from '../../../utils/string-utils';

const EDITABLE_STATUSES = [PAYROLL_STATUS.PENDING_APPROVAL, PAYROLL_STATUS.APPROVE_FOR_PAYMENT];

function PayrollPaymentDateDialog({
  payroll,
  updatePayrollPaymentDate,
  fetchPayroll,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const [isOpen, setIsOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpen = () => {
    setPaymentDate(payroll?.paymentDate ?? null);
    setErrorMessage(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setErrorMessage(null);
  };

  // As validações do backend devolvem chaves i18n (ex.: payroll.validation.payroll.payment_date_locked);
  // formatMessage devolve a chave traduzida se existir e a chave crua se não existir.
  const formatBackendError = (message) => formatMessage(message);

  const handleSave = async () => {
    if (!paymentDate || isSaving) return;
    setErrorMessage(null);
    setIsSaving(true);
    let response;
    try {
      response = await updatePayrollPaymentDate(
        payroll,
        paymentDate,
        formatMessageWithValues('payroll.paymentDate.mutation.updateLabel', mutationLabel(payroll)),
      );
    } catch (e) {
      setErrorMessage(formatMessage('payroll.paymentDate.error.generic'));
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    const gqlErrors = response?.payload?.errors;
    if (gqlErrors?.length) {
      // O backend recusou a alteração (data no passado, payroll já enviado, sem permissão, ...)
      setErrorMessage(gqlErrors.map((e) => formatBackendError(e.message)).join('; '));
      return;
    }
    if (!response || response.error) {
      setErrorMessage(formatMessage('payroll.paymentDate.error.generic'));
      return;
    }
    // Só em caso de sucesso é que o diálogo fecha e o payroll é recarregado
    handleClose();
    if (payroll?.id) {
      fetchPayroll(modulesManager, [`id: "${payroll.id}"`]);
    }
  };

  // Doc 2.3 — esconder o botão quando o payroll já tem benefícios com paymentDate preenchida,
  // ou seja, quando já houve um envio aceite ao BISTP. Dados vêm do bistpSummary que o
  // fetchPayroll já inclui no payroll (sem query nem alterações de backend):
  //  - `pending`   = APPROVE_FOR_PAYMENT -> paymentDate preenchida (pagamento aceite);
  //  - `reconciled` = RECONCILED         -> paymentDate preenchida (confirmado pelo callback).
  const summary = payroll?.bistpSummary ?? {};
  const alreadySentToBistp = payroll?.paymentMethod === PAYMENT_METHOD.STRATEGY_BISTP_PAYMENT
    && ((summary.pending ?? 0) > 0 || (summary.reconciled ?? 0) > 0);

  if (!payroll?.id) return null;
  if (!EDITABLE_STATUSES.includes(payroll?.status)) return null;
  if (alreadySentToBistp) return null;

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outlined"
        color="primary"
        style={{ marginTop: '16px' }}
      >
        {formatMessage('payroll.paymentDate.update')}
      </Button>
      <Dialog open={isOpen} onClose={handleClose}>
        <DialogTitle>{formatMessage('payroll.paymentDate.update')}</DialogTitle>
        <DialogContent style={{ minWidth: 400 }}>
          <PublishedComponent
            pubRef="core.DatePicker"
            module="payroll"
            label="payroll.paymentDate"
            value={paymentDate}
            onChange={setPaymentDate}
            required
            disablePast
          />
          {errorMessage && (
            <Typography color="error" style={{ marginTop: 16 }}>
              {errorMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {formatMessage('payroll.beneficiaries.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={!paymentDate || isSaving}
          >
            {formatMessage('payroll.beneficiaries.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  updatePayrollPaymentDate,
  fetchPayroll,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(PayrollPaymentDateDialog);
