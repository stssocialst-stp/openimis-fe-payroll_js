import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import {
  PublishedComponent,
  useModulesManager,
  useTranslations,
} from '@stssocialst-stp/fe-core';
import { MODULE_NAME, PAYROLL_STATUS } from '../../../constants';
import { updatePayrollPaymentDate, fetchPayroll } from '../../../actions';
import { ACTION_TYPE } from '../../../reducer';
import { mutationLabel } from '../../../utils/string-utils';

const EDITABLE_STATUSES = [PAYROLL_STATUS.PENDING_APPROVAL, PAYROLL_STATUS.APPROVE_FOR_PAYMENT];

function PayrollPaymentDateDialog({
  payroll,
  updatePayrollPaymentDate,
  fetchPayroll,
  submittingMutation,
  mutation,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(MODULE_NAME, modulesManager);
  const [isOpen, setIsOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(null);

  const handleOpen = () => {
    setPaymentDate(payroll?.paymentDate ?? null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSave = () => {
    if (!paymentDate) return;
    updatePayrollPaymentDate(
      payroll,
      paymentDate,
      formatMessageWithValues('payroll.paymentDate.mutation.updateLabel', mutationLabel(payroll)),
    );
  };

  useEffect(() => {
    if (!submittingMutation && mutation?.actionType === ACTION_TYPE.UPDATE_PAYROLL_PAYMENT_DATE
      && mutation?.clientMutationId && isOpen) {
      handleClose();
      if (payroll?.id) {
        fetchPayroll(modulesManager, [`id: "${payroll.id}"`]);
      }
    }
  }, [submittingMutation]);

  if (!payroll?.id) return null;
  if (!EDITABLE_STATUSES.includes(payroll?.status)) return null;

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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {formatMessage('payroll.beneficiaries.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={!paymentDate}
          >
            {formatMessage('payroll.beneficiaries.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const mapStateToProps = (state) => ({
  submittingMutation: state.payroll.submittingMutation,
  mutation: state.payroll.mutation,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  updatePayrollPaymentDate,
  fetchPayroll,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(PayrollPaymentDateDialog);
