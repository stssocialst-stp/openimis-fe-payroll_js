/* eslint-disable max-len */
import React, { useState, useEffect } from 'react';
import {
  Paper, Grid, LinearProgress, Typography,
} from '@material-ui/core';
import {
  Contributions,
  useModulesManager,
  useTranslations,
} from '@stssocialst-stp/fe-core';
import { makeStyles } from '@material-ui/styles';
import Button from '@material-ui/core/Button';
import {
  BENEFIT_CONSUMPTION_LIST_TAB_VALUE,
  PAYROLL_TABS_LABEL_CONTRIBUTION_KEY,
  PAYROLL_TABS_PANEL_CONTRIBUTION_KEY,
  PAYROLL_STATUS,
  MODULE_NAME,
  PAYMENT_METHOD,
} from '../../constants';
import PayrollPaymentDataUploadDialog from './dialogs/PayrollPaymentDataUploadDialog';
import PaymentApproveForPaymentSummary from './dialogs/PaymentApproveForPaymentSummary';
import downloadPayroll from '../../utils/export';
import useAsyncPayrollProgress from '../../hooks/useAsyncPayrollProgress';

const useStyles = makeStyles((theme) => ({
  paper: theme.paper.paper,
  tableTitle: theme.table.title,
  tabs: {
    display: 'flex',
    alignItems: 'center',
  },
  selectedTab: {
    borderBottom: '4px solid white',
  },
  unselectedTab: {
    borderBottom: '4px solid transparent',
  },
  button: {
    marginLeft: 'auto',
    padding: theme.spacing(1),
    fontSize: '0.875rem',
    textTransform: 'none',
  },
}));

function PayrollTab({
  rights, setConfirmedAction, payrollUuid, isInTask, payroll, isPayrollFromFailedInvoices,
}) {
  const classes = useStyles();

  const [activeTab, setActiveTab] = useState(BENEFIT_CONSUMPTION_LIST_TAB_VALUE);

  const isSelected = (tab) => tab === activeTab;

  const tabStyle = (tab) => (isSelected(tab) ? classes.selectedTab : classes.unselectedTab);

  const handleChange = (_, tab) => setActiveTab(tab);

  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  const { isGenerating, benefitCount, timedOut } = useAsyncPayrollProgress({
    payrollUuid,
    payrollStatus: payroll?.status,
  });

  const [generationComplete, setGenerationComplete] = useState(false);
  const [refreshBenefitsKey, setRefreshBenefitsKey] = useState(0);

  useEffect(() => {
    if (!isGenerating && benefitCount > 0 && !generationComplete) {
      setGenerationComplete(true);
      setRefreshBenefitsKey((k) => k + 1);
    }
  }, [isGenerating, benefitCount, generationComplete]);

  const downloadPayrollData = (payrollUuid, payrollName) => {
    downloadPayroll(payrollUuid, payrollName);
  };

  return (
    <Paper className={classes.paper}>
      {(isGenerating || timedOut) && payrollUuid && !isPayrollFromFailedInvoices && (
        <Grid container spacing={2} style={{ padding: '16px' }}>
          <Grid item xs={12}>
            <Typography variant="body1">
              {timedOut
                ? formatMessage('payroll.async.timedOut')
                : formatMessage('payroll.async.generating')}
            </Typography>
            {!timedOut && (
              <LinearProgress
                variant="indeterminate"
                style={{ marginTop: '8px' }}
              />
            )}
            <Typography variant="caption" style={{ display: 'block', marginTop: '4px' }}>
              {!timedOut && formatMessage('payroll.async.createdSoFar', { benefitCount })}
            </Typography>
            <Typography variant="caption" style={{ display: 'block' }}>
              {!timedOut && formatMessage('payroll.async.note')}
            </Typography>
          </Grid>
        </Grid>
      )}
      <Grid container className={`${classes.tableTitle} ${classes.tabs}`}>
        <div style={{ width: '100%' }}>
          <div style={{ float: 'left' }}>
            <Contributions
              contributionKey={PAYROLL_TABS_LABEL_CONTRIBUTION_KEY}
              rights={rights}
              value={activeTab}
              onChange={handleChange}
              isSelected={isSelected}
              tabStyle={tabStyle}
              payroll={payroll}
              payrollUuid={payrollUuid}
              isInTask={isInTask}
              isPayrollFromFailedInvoices={isPayrollFromFailedInvoices}
            />
          </div>
          <div style={{ float: 'right', paddingRight: '16px' }}>
            {payrollUuid && !isPayrollFromFailedInvoices && (
            <Button
              onClick={() => downloadPayrollData(payrollUuid, payroll.name)}
              color="#DFEDEF"
              className={classes.button}
              style={{
                border: '0px',
                marginTop: '6px',
                textTransform: 'uppercase',
              }}
            >
              {formatMessage('payroll.summary.download')}
            </Button>
            )}
            {payrollUuid && payroll?.status === PAYROLL_STATUS.APPROVE_FOR_PAYMENT && payroll.paymentMethod === PAYMENT_METHOD.STRATEGY_OFFLINE_PAYMENT
                && (
                <PayrollPaymentDataUploadDialog
                  payrollUuid={payrollUuid}
                />
                )}
            {payrollUuid && payroll?.status === PAYROLL_STATUS.APPROVE_FOR_PAYMENT && payroll.paymentMethod === PAYMENT_METHOD.STRATEGY_BISTP_PAYMENT
                && (
                <PaymentApproveForPaymentSummary
                  classes={{}}
                  payrollDetail={payroll}
                />
                )}
          </div>
        </div>
      </Grid>
      <Contributions
        contributionKey={PAYROLL_TABS_PANEL_CONTRIBUTION_KEY}
        rights={rights}
        value={activeTab}
        setConfirmedAction={setConfirmedAction}
        payrollUuid={payrollUuid}
        isInTask={isInTask}
        isPayrollFromFailedInvoices={isPayrollFromFailedInvoices}
        payroll={payroll}
        refreshBenefitsKey={refreshBenefitsKey}
      />
    </Paper>
  );
}

export default PayrollTab;
