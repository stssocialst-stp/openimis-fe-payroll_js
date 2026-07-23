/* eslint-disable max-len */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import PrintIcon from '@material-ui/icons/Print';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Typography, Button,
} from '@material-ui/core';

import {
  Searcher, useModulesManager, useTranslations,
} from '@stssocialst-stp/fe-core';
import Chip from '@material-ui/core/Chip';
import PhotoCameraOutlinedIcon from '@material-ui/icons/PhotoCameraOutlined';
import { fetchBenefitConsumptions } from '../../actions';
import { BENEFIT_CONSUMPTION_STATUS, DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS, PAYMENT_METHOD } from '../../constants';
import BenefitConsumptionFilter from './BenefitConsumptionFilter';
import AdditionalFieldsDialog from './dialogs/AdditionalFieldsDialog';
import PayrollPrintTemplate from '../PayrollPrintTemplate';

function BenefitConsumptionSearcher({
  fetchBenefitConsumptions,
  fetchingBenefitConsumptions,
  fetchedBenefitConsumptions,
  errorBenefitConsumptions,
  benefitConsumptions,
  benefitConsumptionsPageInfo,
  benefitConsumptionsTotalCount,
  isPayrollFromFailedInvoices,
  payrollUuid,
}) {
  const modulesManager = useModulesManager();
  const { formatMessageWithValues } = useTranslations('payroll', modulesManager);
  const payrollPrintTemplateRef = useRef(null);

  const handlePrint = useReactToPrint({
    documentTitle: `${payrollUuid}`,
  });

  const fetch = (params) => fetchBenefitConsumptions(modulesManager, params);

  const headers = () => {
    const cols = [
      'benefitConsumption.individual.firstName',
      'benefitConsumption.individual.lastName',
      'benefitConsumption.nib',
      'benefitConsumption.photo',
      'benefitConsumption.code',
      'benefitConsumption.dateDue',
      'benefitConsumption.receipt',
      'benefitConsumption.amount',
      'benefitConsumption.type',
      'benefitConsumption.status',
      'benefitConsumption.payedOnTime',
      'benefitConsumption.paymentDate',
      '',
    ];
    return cols;
  };

  const checkBenefitDueDate = (benefitConsumption) => {
    if (!benefitConsumption.receipt) {
      return ''; // return empty string if datePayed is null
    }

    return (
      benefitConsumption
      && benefitConsumption.dateDue
      >= benefitConsumption.benefitAttachment[0].bill.datePayed)
      ? 'True' : 'False';
  };

  const getBistpStatusBadge = (benefitConsumption) => {
    if (!benefitConsumption) return null;
    const jsonExt = benefitConsumption.jsonExt || {};
    const { status } = benefitConsumption;

    if (status === BENEFIT_CONSUMPTION_STATUS.RECONCILED) {
      return <Chip label={formatMessage('payroll.bistp.status.reconciled')} style={{ backgroundColor: '#4caf50', color: 'white' }} size="small" />;
    }
    if (status === BENEFIT_CONSUMPTION_STATUS.REJECTED) {
      return <Chip label={`${formatMessage('payroll.bistp.status.rejected')}${jsonExt.bistp_rejection_reason ? `: ${jsonExt.bistp_rejection_reason}` : ''}`} style={{ backgroundColor: '#f44336', color: 'white' }} size="small" />;
    }
    if (status === BENEFIT_CONSUMPTION_STATUS.APPROVE_FOR_PAYMENT) {
      return <Chip label={formatMessage('payroll.bistp.status.pending')} style={{ backgroundColor: '#ff9800', color: 'white' }} size="small" />;
    }
    if (jsonExt.bistp_skip_reason === 'nib_ausente') {
      return <Chip label={formatMessage('payroll.bistp.status.skippedNib')} style={{ backgroundColor: '#9e9e9e', color: 'white' }} size="small" />;
    }
    if (jsonExt.bistp_skip_reason === 'envio_falhou') {
      return <Chip label={formatMessage('payroll.bistp.status.sendFailed')} style={{ backgroundColor: '#f44336', color: 'white' }} size="small" />;
    }
    return null;
  };

  const itemFormatters = () => [
    (benefitConsumption) => benefitConsumption?.individual?.firstName,
    (benefitConsumption) => benefitConsumption?.individual?.lastName,
    (benefitConsumption) => benefitConsumption?.individual?.nib || '',
    (benefitConsumption) => (
      benefitConsumption.receipt ? (
        <PhotoCameraOutlinedIcon style={{ fontSize: 150 }} />
      ) : null
    ),
    (benefitConsumption) => benefitConsumption?.code,
    (benefitConsumption) => benefitConsumption?.dateDue,
    (benefitConsumption) => benefitConsumption?.receipt,
    (benefitConsumption) => benefitConsumption?.amount,
    (benefitConsumption) => benefitConsumption?.type,
    (benefitConsumption) => (isPayrollFromFailedInvoices
      ? BENEFIT_CONSUMPTION_STATUS.APPROVE_FOR_PAYMENT : benefitConsumption?.status),
    (benefitConsumption) => checkBenefitDueDate(benefitConsumption),
    (benefitConsumption) => (
      !benefitConsumption.receipt
        ? ''
        : benefitConsumption?.benefitAttachment[0]?.bill?.datePayed
    ),
    (benefitConsumption) => {
      const jsonExt = benefitConsumption?.jsonExt || {};
      const hasBistpFields = jsonExt.bistp_skip_reason || jsonExt.bistp_processed || jsonExt.bistp_rejection_reason;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {hasBistpFields && getBistpStatusBadge(benefitConsumption)}
          <AdditionalFieldsDialog
            jsonExt={benefitConsumption?.jsonExt}
            buttonLabel="payroll.additonalFields.showAdditionalFields"
            title="payroll.additonalFields.label"
          />
        </div>
      );
    },
  ];

  const rowIdentifier = (benefitConsumption) => benefitConsumption.id;

  const sorts = () => [
    ['individual_FirstName', true],
    ['individual_LastName', true],
    ['individual_Nib', true],
    ['photo', true],
    ['code', true],
    ['dateDue', true],
    ['receipt', true],
    ['amount', true],
    ['type', true],
    ['status', true],
  ];

  const defaultFilters = () => {
    const filters = {
      isDeleted: {
        value: false,
        filter:
        'isDeleted: false',
      },
      payrollUuid: {
        value: payrollUuid,
        filter:
        `payrollUuid: "${payrollUuid}"`,
      },
    };
    if (isPayrollFromFailedInvoices) {
      filters.status = {
        value: true,
        filter:
        `filterOnlyUnpaid: ${true}`,
      };
    }
    return filters;
  };

  const benefitConsumptionFilter = ({ filters, onChangeFilters }) => (
    <BenefitConsumptionFilter filters={filters} onChangeFilters={onChangeFilters} />
  );

  return (
    <>
      <div>
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={(e) => {
            e.preventDefault();
            handlePrint(null, () => payrollPrintTemplateRef.current);
          }}
        >
          <Typography variant="subtitle1">Print</Typography>
        </Button>
      </div>
      <div>
        <Searcher
          module="payroll"
          FilterPane={!isPayrollFromFailedInvoices && benefitConsumptionFilter}
          fetch={fetch}
          items={benefitConsumptions}
          itemsPageInfo={benefitConsumptionsPageInfo}
          fetchingItems={fetchingBenefitConsumptions}
          fetchedItems={fetchedBenefitConsumptions}
          errorItems={errorBenefitConsumptions}
          tableTitle={formatMessageWithValues('benefitConsumption.searcherResultsTitle', { benefitConsumptionsTotalCount })}
          headers={headers}
          itemFormatters={itemFormatters}
          sorts={sorts}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          defaultPageSize={DEFAULT_PAGE_SIZE}
          rowIdentifier={rowIdentifier}
          defaultFilters={defaultFilters()}
        />
        <div style={{ display: 'none' }}>
          <PayrollPrintTemplate
            ref={payrollPrintTemplateRef}
            benefitConsumptions={benefitConsumptions}
          />
        </div>
      </div>
    </>
  );
}

const mapStateToProps = (state) => ({
  fetchingBenefitConsumptions: state.payroll.fetchingBenefitConsumptions,
  fetchedBenefitConsumptions: state.payroll.fetchedBenefitConsumptions,
  errorBenefitConsumptions: state.payroll.errorBenefitConsumptions,
  benefitConsumptions: state.payroll.benefitConsumptions,
  benefitConsumptionsPageInfo: state.payroll.benefitConsumptionsPageInfo,
  benefitConsumptionsTotalCount: state.payroll.benefitConsumptionsTotalCount,
});

const mapDispatchToProps = (dispatch) => bindActionCreators(
  { fetchBenefitConsumptions },
  dispatch,
);

export default connect(mapStateToProps, mapDispatchToProps)(BenefitConsumptionSearcher);
