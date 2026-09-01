import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { graphql } from '@stssocialst-stp/fe-core';

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 600000;

const COUNT_QUERY = (payrollUuid) => `
  {
    benefitConsumptionByPayroll(payrollUuid: "${payrollUuid}", first: 0, isDeleted: false) {
      totalCount
    }
  }
`;

export default function useAsyncPayrollProgress({ payrollUuid, payrollStatus }) {
  const dispatch = useDispatch();
  const [benefitCount, setBenefitCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const pollRef = useRef(null);
  const startTimeRef = useRef(null);
  const prevCountRef = useRef(0);
  const stableCountRounds = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchCount = useCallback(() => {
    if (!payrollUuid) return;
    dispatch(graphql(COUNT_QUERY(payrollUuid), 'POLL_BENEFIT_COUNT'))
      .then((response) => {
        const count = response?.payload?.data?.benefitConsumptionByPayroll?.totalCount ?? 0;

        if (count === 0) {
          setBenefitCount(count);
          setIsGenerating(true);
          stableCountRounds.current = 0;
          prevCountRef.current = count;
          return;
        }

        setBenefitCount(count);

        if (count === prevCountRef.current) {
          stableCountRounds.current += 1;
        } else {
          stableCountRounds.current = 0;
        }
        prevCountRef.current = count;

        if (stableCountRounds.current >= 2) {
          setIsGenerating(false);
          stopPolling();
        }
      })
      .catch(() => {
        setBenefitCount((c) => Math.max(c, 0));
      });
  }, [payrollUuid, dispatch, stopPolling]);

  useEffect(() => {
    const shouldPoll = payrollUuid && payrollStatus === 'PENDING_APPROVAL';

    if (shouldPoll && !pollRef.current) {
      setTimedOut(false);
      startTimeRef.current = Date.now();
      stableCountRounds.current = 0;
      prevCountRef.current = 0;

      fetchCount();

      pollRef.current = setInterval(() => {
        if (Date.now() - startTimeRef.current >= TIMEOUT_MS) {
          setIsGenerating(false);
          setTimedOut(true);
          stopPolling();
          return;
        }
        fetchCount();
      }, POLL_INTERVAL_MS);
    }

    if (!shouldPoll && pollRef.current) {
      setIsGenerating(false);
      stopPolling();
    }

    return () => stopPolling();
  }, [payrollUuid, payrollStatus, fetchCount, stopPolling]);

  return { isGenerating, benefitCount, timedOut };
}