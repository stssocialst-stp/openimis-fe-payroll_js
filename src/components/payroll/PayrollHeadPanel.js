/* eslint-disable camelcase */
import React from 'react';
import { injectIntl } from 'react-intl';

import { Grid, Divider, Typography } from '@material-ui/core';
import { withStyles, withTheme } from '@material-ui/core/styles';

import {
  formatMessage,
  FormPanel,
  PublishedComponent,
  TextInput,
  withModulesManager,
  FormattedMessage,
} from '@stssocialst-stp/fe-core';
import AdvancedFiltersDialog from './AdvancedFiltersDialog';
import { CLEARED_STATE_FILTER } from '../../constants';
import PayrollStatusPicker from './PayrollStatusPicker';
import PaymentMethodPicker from '../../pickers/PaymentMethodPicker';

const styles = (theme) => ({
  tableTitle: theme.table.title,
  item: theme.paper.item,
  fullHeight: {
    height: '100%',
  },
});

class PayrollHeadPanel extends FormPanel {
  constructor(props) {
    super(props);
    this.state = {
      appliedCustomFilters: [CLEARED_STATE_FILTER],
      appliedFiltersRowStructure: [CLEARED_STATE_FILTER],
    };
  }

  componentDidMount() {
    this.setStateFromProps(this.props);
  }

  setStateFromProps = (props) => {
    const { jsonExt } = props?.edited ?? {};
    if (jsonExt) {
      const filters = this.getDefaultAppliedCustomFilters(jsonExt);
      this.setState({ appliedCustomFilters: filters, appliedFiltersRowStructure: filters });
    }
  };

  updateJsonExt = (value) => {
    this.updateAttributes({
      jsonExt: value,
    });
  };

  // eslint-disable-next-line class-methods-use-this
  getDefaultAppliedCustomFilters = (jsonExt) => {
    try {
      const jsonData = JSON.parse(jsonExt);
      const advancedCriteria = jsonData.advanced_criteria || [];
      const transformedCriteria = advancedCriteria.map(({ custom_filter_condition }) => {
        const [field, filter, typeValue] = custom_filter_condition.split('__');
        const [type, value] = typeValue.split('=');
        return {
          custom_filter_condition,
          field,
          filter,
          type,
          value,
        };
      });
      return transformedCriteria;
    } catch (error) {
      return [];
    }
  };

  setAppliedCustomFilters = (appliedCustomFilters) => {
    this.setState({ appliedCustomFilters });
  };

  setAppliedFiltersRowStructure = (appliedFiltersRowStructure) => {
    this.setState({ appliedFiltersRowStructure });
  };

  render() {
    const {
      edited, classes, intl, readOnly, isPayrollFromFailedInvoices, benefitPlanId,
    } = this.props;
    const payroll = { ...edited };
    const { appliedCustomFilters, appliedFiltersRowStructure } = this.state;
    return (
      <>
        <Grid container className={classes.item}>
          <Grid item xs={3} className={classes.item}>
            <TextInput
              module="payroll"
              label={formatMessage(intl, 'payroll', 'paymentPoint.name')}
              value={payroll?.name}
              required
              onChange={(name) => this.updateAttribute('name', name)}
              readOnly={isPayrollFromFailedInvoices ? !isPayrollFromFailedInvoices : readOnly}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="contributionPlan.PaymentPlanPicker"
              required
              filterLabels={false}
              onChange={(paymentPlan) => this.updateAttribute('paymentPlan', paymentPlan)}
              value={payroll?.paymentPlan}
              readOnly={readOnly}
              benefitPlanId={benefitPlanId}
            />
          </Grid>
          <Grid item xs={3} className={classes.item}>
            <PublishedComponent
              pubRef="paymentCycle.PaymentCyclePicker"
              withLabel
              required
              withPlaceholder
              filterLabels={false}
              onChange={(paymentCycle) => this.updateAttribute('paymentCycle', paymentCycle)}
              value={payroll?.paymentCycle}
              readOnly={isPayrollFromFailedInvoices ? !isPayrollFromFailedInvoices : readOnly}
            />
          </Grid>
          {readOnly && !isPayrollFromFailedInvoices && (
          <Grid item xs={3} className={classes.item}>
            <PayrollStatusPicker
              required
              withNull={false}
              readOnly={readOnly}
              value={!!payroll?.status && payroll.status}
            />
          </Grid>
          )}
          <Grid item xs={3} className={classes.item}>
            <PaymentMethodPicker
              required
              withNull={false}
              readOnly={readOnly}
              value={!!payroll?.paymentMethod && payroll.paymentMethod}
              onChange={(paymentMethod) => this.updateAttribute('paymentMethod', paymentMethod)}
              label={formatMessage(intl, 'payroll', 'paymentMethod')}
            />
          </Grid>
        </Grid>
        <Divider />
        {!isPayrollFromFailedInvoices
            && (
            <>
              <>
                <Typography>
                  <div className={classes.item}>
                    <FormattedMessage module="contributionPlan" id="paymentPlan.advancedCriteria" />
                  </div>
                </Typography>
                {!readOnly && (
                  <div className={classes.item}>
                    <FormattedMessage module="contributionPlan" id="paymentPlan.advancedCriteria.tip" />
                  </div>
                )}
                <Divider />
                <Grid container className={classes.item}>

                  <AdvancedFiltersDialog
                    object={null}
                    objectToSave={payroll}
                    moduleName="social_protection"
                    objectType="BenefitPlan"
                    setAppliedCustomFilters={this.setAppliedCustomFilters}
                    appliedCustomFilters={appliedCustomFilters}
                    appliedFiltersRowStructure={appliedFiltersRowStructure}
                    setAppliedFiltersRowStructure={this.setAppliedFiltersRowStructure}
                    updateAttributes={this.updateJsonExt}
                    getDefaultAppliedCustomFilters={() => this.getDefaultAppliedCustomFilters(payroll.jsonExt)}
                    readOnly={readOnly}
                    edited={this.props.edited}
                  />

                </Grid>
              </>
              <Divider />
            </>
            )}
      </>
    );
  }
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(PayrollHeadPanel))));
