import React from 'react';
import {
  Grid, LinearProgress, Paper, Tab, Typography,
} from '@material-ui/core';
import { PublishedComponent, useModulesManager, useTranslations } from '@stssocialst-stp/fe-core';
import { makeStyles } from '@material-ui/styles';
import {
  BISTP_PAYMENT_STATUS_TAB_VALUE,
  MODULE_NAME,
  PAYMENT_METHOD,
} from '../../constants';

const useStyles = makeStyles((theme) => ({
  paper: theme.paper.paper,
  content: {
    padding: theme.spacing(2),
  },
  metric: {
    padding: theme.spacing(1.5),
    border: '1px solid rgba(0, 0, 0, 0.12)',
  },
  metricValue: {
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  progress: {
    marginTop: theme.spacing(2),
  },
}));

function BistpPaymentStatusTabLabel({
  onChange, tabStyle, isSelected, modulesManager, payrollUuid, payroll, isInTask, isPayrollFromFailedInvoices,
}) {
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  if (
    !payrollUuid
    || payroll?.paymentMethod !== PAYMENT_METHOD.STRATEGY_BISTP_PAYMENT
    || isInTask
    || isPayrollFromFailedInvoices
  ) return null;

  return (
    <Tab
      onChange={onChange}
      className={tabStyle(BISTP_PAYMENT_STATUS_TAB_VALUE)}
      selected={isSelected(BISTP_PAYMENT_STATUS_TAB_VALUE)}
      value={BISTP_PAYMENT_STATUS_TAB_VALUE}
      label={formatMessage('payroll.bistp.viewSummary')}
    />
  );
}

function BistpMetric({ label, value, classes }) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <div className={classes.metric}>
        <Typography variant="body2">{label}</Typography>
        <Typography className={classes.metricValue}>{value}</Typography>
      </div>
    </Grid>
  );
}

function BistpPaymentStatusPanel({ value, payrollUuid, payroll }) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  if (payroll?.paymentMethod !== PAYMENT_METHOD.STRATEGY_BISTP_PAYMENT) return null;

  const summary = payroll?.bistpSummary || {};
  const total = summary.total || 0;
  const reconciled = summary.reconciled || 0;
  const progress = total > 0 ? Math.min((reconciled / total) * 100, 100) : 0;

  return (
    <PublishedComponent
      pubRef="policyHolder.TabPanel"
      module="payroll"
      index={BISTP_PAYMENT_STATUS_TAB_VALUE}
      value={value}
    >
      {payrollUuid && (
        <Paper className={classes.paper}>
          <div className={classes.content}>
            <Grid container spacing={2}>
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.summary.totalNumberOfBenefits')}
                value={total}
              />
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.bistp.status.reconciled')}
                value={summary.reconciled || 0}
              />
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.bistp.status.pending')}
                value={summary.pending || 0}
              />
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.bistp.status.rejected')}
                value={summary.rejected || 0}
              />
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.bistp.status.sendFailed')}
                value={summary.sendFailed || 0}
              />
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.bistp.status.skippedNib')}
                value={summary.skippedNib || 0}
              />
            </Grid>
            <div className={classes.progress}>
              <Typography variant="body2">
                {formatMessage('payroll.bistp.progress')}: {reconciled}/{total}
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </div>
          </div>
        </Paper>
      )}
    </PublishedComponent>
  );
}

export { BistpPaymentStatusTabLabel, BistpPaymentStatusPanel };