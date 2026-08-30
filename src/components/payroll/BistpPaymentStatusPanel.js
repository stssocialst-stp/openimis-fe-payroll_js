import React, { useEffect } from 'react';
import {
  Grid, LinearProgress, Paper, Tab, Typography,
} from '@material-ui/core';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { PublishedComponent, useModulesManager, useTranslations } from '@stssocialst-stp/fe-core';
import { makeStyles } from '@material-ui/styles';
import {
  BISTP_PAYMENT_STATUS_TAB_VALUE,
  MODULE_NAME,
  PAYMENT_METHOD,
} from '../../constants';
import { fetchBistpSummary } from '../../actions';

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

function BistpPaymentStatusPanel({
  value, payrollUuid, payroll, fetchBistpSummary, bistpSummary,
}) {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);

  useEffect(() => {
    if (payrollUuid) {
      fetchBistpSummary(payrollUuid);
    }
  }, [payrollUuid]);

  if (payroll?.paymentMethod !== PAYMENT_METHOD.STRATEGY_BISTP_PAYMENT) return null;

  const total = bistpSummary?.total?.totalCount || 0;
  const confirmados = bistpSummary?.confirmados?.totalCount || 0;
  const pendentes = bistpSummary?.pendentes?.totalCount || 0;
  const rejeitados = bistpSummary?.rejeitados?.totalCount || 0;
  const enviados = bistpSummary?.enviados?.totalCount || 0;
  const progress = total > 0 ? Math.min((confirmados / total) * 100, 100) : 0;

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
                value={confirmados}
              />
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.bistp.status.pending')}
                value={pendentes}
              />
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.bistp.status.rejected')}
                value={rejeitados}
              />
              <BistpMetric
                classes={classes}
                label={formatMessage('payroll.bistp.status.enviados')}
                value={enviados}
              />
            </Grid>
            <div className={classes.progress}>
              <Typography variant="body2">
                {formatMessage('payroll.bistp.progress')}: {confirmados}/{total}
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </div>
          </div>
        </Paper>
      )}
    </PublishedComponent>
  );
}

const mapStateToProps = (state) => ({
  bistpSummary: state.payroll.bistpSummary,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  { fetchBistpSummary },
  dispatch,
);

export default connect(mapStateToProps, mapDispatchToProps)(BistpPaymentStatusPanel);
export { BistpPaymentStatusTabLabel, BistpPaymentStatusPanel };
