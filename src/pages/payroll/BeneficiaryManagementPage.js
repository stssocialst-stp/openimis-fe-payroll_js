import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/styles';
import {
  Helmet,
  useModulesManager,
  useTranslations,
} from '@stssocialst-stp/fe-core';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { Alert } from '@material-ui/lab';
import { RIGHT_BENEFICIARY_MANAGEMENT, MODULE_NAME } from '../../constants';
import { useBeneficiarios } from '../../hooks/useBeneficiarios';

const useStyles = makeStyles((theme) => ({
  page: theme.page,
  card: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
  },
  field: {
    marginBottom: theme.spacing(2),
  },
  output: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    fontFamily: 'monospace',
    fontSize: 12,
    whiteSpace: 'pre-wrap',
    maxHeight: 320,
    overflow: 'auto',
    borderRadius: 4,
  },
  actions: {
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  },
}));

function Card({ title, children, classes }) {
  return (
    <Paper className={classes.card}>
      <Typography variant="h6" className={classes.sectionTitle}>{title}</Typography>
      {children}
    </Paper>
  );
}

function BeneficiaryManagementPage() {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(MODULE_NAME, modulesManager);
  const rights = useSelector((store) => store.core.user?.i_user?.rights ?? []);
  const {
    backup, limpar, importar, restore, loading, output, error, setOutput, setError,
  } = useBeneficiarios();

  const [payrollId, setPayrollId] = useState('');
  const [backupPayrollId, setBackupPayrollId] = useState('');

  const [limparForce, setLimparForce] = useState(false);
  const [confirmLimpar, setConfirmLimpar] = useState(false);

  const [importFile, setImportFile] = useState(null);
  const [importPayrollId, setImportPayrollId] = useState('');
  const [importBenefitPlanId, setImportBenefitPlanId] = useState('');
  const [importDryRun, setImportDryRun] = useState(false);

  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreDryRun, setRestoreDryRun] = useState(true);

  if (!rights.includes(RIGHT_BENEFICIARY_MANAGEMENT)) {
    return (
      <div className={classes.page}>
        <Helmet title={formatMessage('payroll.beneficiaries.management.title')} />
        <Alert severity="warning">
          {formatMessage('payroll.beneficiaries.management.noPermission')}
        </Alert>
      </div>
    );
  }

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('payroll.beneficiaries.management.title')} />
      <Typography variant="h5" className={classes.sectionTitle}>
        {formatMessage('payroll.beneficiaries.management.title')}
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} className={classes.field}>
          {error}
        </Alert>
      )}

      <Card title={formatMessage('payroll.beneficiaries.backup.title')} classes={classes}>
        <TextField
          className={classes.field}
          fullWidth
          label={formatMessage('payroll.beneficiaries.payrollId.optional')}
          value={backupPayrollId}
          onChange={(e) => setBackupPayrollId(e.target.value)}
        />
        <div className={classes.actions}>
          <Button
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={() => backup(backupPayrollId || null)}
          >
            {formatMessage('payroll.beneficiaries.backup.button')}
          </Button>
        </div>
      </Card>

      <Card title={formatMessage('payroll.beneficiaries.limpar.title')} classes={classes}>
        <FormControlLabel
          control={(
            <Checkbox
              checked={limparForce}
              onChange={(e) => setLimparForce(e.target.checked)}
            />
          )}
          label={formatMessage('payroll.beneficiaries.limpar.forceSkipFinancial')}
        />
        <div className={classes.actions}>
          <Button
            variant="outlined"
            disabled={loading}
            onClick={() => limpar({ dryRun: true, forceSkipFinancial: limparForce })}
          >
            {formatMessage('payroll.beneficiaries.limpar.dryRun')}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={loading}
            onClick={() => setConfirmLimpar(true)}
          >
            {formatMessage('payroll.beneficiaries.limpar.execute')}
          </Button>
        </div>
        <Dialog open={confirmLimpar} onClose={() => setConfirmLimpar(false)}>
          <DialogTitle>{formatMessage('payroll.beneficiaries.limpar.confirm.title')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {formatMessage('payroll.beneficiaries.limpar.confirm.message')}
              {limparForce && (
                ` ${formatMessage('payroll.beneficiaries.limpar.confirm.forceNote')}`
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmLimpar(false)}>
              {formatMessage('payroll.beneficiaries.cancel')}
            </Button>
            <Button
              color="secondary"
              variant="contained"
              onClick={async () => {
                setConfirmLimpar(false);
                await limpar({ dryRun: false, forceSkipFinancial: limparForce });
              }}
            >
              {formatMessage('payroll.beneficiaries.confirm')}
            </Button>
          </DialogActions>
        </Dialog>
      </Card>

      <Card title={formatMessage('payroll.beneficiaries.import.title')} classes={classes}>
        <input
          className={classes.field}
          type="file"
          accept=".xlsx"
          onChange={(e) => setImportFile(e.target.files[0])}
        />
        <TextField
          className={classes.field}
          fullWidth
          label="Payroll UUID"
          value={importPayrollId}
          onChange={(e) => setImportPayrollId(e.target.value)}
        />
        <TextField
          className={classes.field}
          fullWidth
          label="Benefit Plan UUID"
          value={importBenefitPlanId}
          onChange={(e) => setImportBenefitPlanId(e.target.value)}
        />
        <FormControlLabel
          control={(
            <Checkbox
              checked={importDryRun}
              onChange={(e) => setImportDryRun(e.target.checked)}
            />
          )}
          label={formatMessage('payroll.beneficiaries.dryRun')}
        />
        <div className={classes.actions}>
          <Button
            variant="contained"
            color="primary"
            disabled={loading || !importFile}
            onClick={() => importar(importFile, {
              dryRun: importDryRun,
              payrollId: importPayrollId || null,
              benefitPlanId: importBenefitPlanId || null,
            })}
          >
            {formatMessage('payroll.beneficiaries.import.button')}
          </Button>
        </div>
      </Card>

      <Card title={formatMessage('payroll.beneficiaries.restore.title')} classes={classes}>
        <input
          className={classes.field}
          type="file"
          accept=".json"
          onChange={(e) => setRestoreFile(e.target.files[0])}
        />
        <FormControlLabel
          control={(
            <Checkbox
              checked={restoreDryRun}
              onChange={(e) => setRestoreDryRun(e.target.checked)}
            />
          )}
          label={formatMessage('payroll.beneficiaries.dryRun')}
        />
        <div className={classes.actions}>
          <Button
            variant="contained"
            color="primary"
            disabled={loading || !restoreFile}
            onClick={() => restore(restoreFile, { dryRun: restoreDryRun })}
          >
            {formatMessage('payroll.beneficiaries.restore.button')}
          </Button>
        </div>
      </Card>

      {output && (
        <Paper className={classes.card}>
          <Typography variant="subtitle1" className={classes.sectionTitle}>
            {formatMessage('payroll.beneficiaries.output')}
          </Typography>
          <Divider className={classes.field} />
          {loading && <CircularProgress size={18} />}
          <Box className={classes.output}>{output}</Box>
        </Paper>
      )}
    </div>
  );
}

export default BeneficiaryManagementPage;
