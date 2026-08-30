import React, { useState, useEffect } from 'react';
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
  const [summary, setSummary] = useState({
    total: 0,
    pendentes: 0,
    enviados: 0,
    confirmados: 0,
    rejeitados: 0,
  });

  useEffect(() => {
    if (payrollUuid) {
      const query = `
        query ResumoPagamentos($payrollId: UUID!) {
          total:       benefitConsumptionByPayroll(payrollUuid: $payrollId, first: 0) { totalCount }
          pendentes:   benefitConsumptionByPayroll(payrollUuid: $payrollId, status: "ACCEPTED", first: 0) { totalCount }
          enviados:    benefitConsumptionByPayroll(payrollUuid: $payrollId, status: "APPROVE_FOR_PAYMENT", first: 0) { totalCount }
          confirmados: benefitConsumptionByPayroll(payrollUuid: $payrollId, status: "RECONCILED", first: 0) { totalCount }
          rejeitados:  benefitConsumptionByPayroll(payrollUuid: $payrollId, status: "REJECTED", first: 0) { totalCount }
        }
      `;

      // Using fetch directly as suggested in the guide to avoid Redux complications for a simple summary
      fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ query, variables: { payrollId: payrollUuid } }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.data) {
            setSummary({
              total: result.data.total.totalCount,
              pendentes: result.data.pendentes.totalCount,
              enviados: result.data.enviados.totalCount,
              confirmados: result.data.confirmados.totalCount,
              rejeitados: result.data.rejeitados.totalCount,
            });
          }
        });
    }
  }, [payrollUuid]);

  if (payroll?.paymentMethod !== PAYMENT_METHOD.STRATEGY_BISTP_PAYMENT) return null;

  const total = summary.total || 0;
  const reconciled = summary.confirmados || 0;
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
                value={summary.confirmados || 0}
              />
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.bistp.status.pending')}
                value={summary.pendentes || 0}
              />
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.bistp.status.rejected')}
                value={summary.rejeitados || 0}
              />
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.bistp.status.enviados')}
                value={summary.enviados || 0}
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