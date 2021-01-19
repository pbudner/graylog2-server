/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import moment from 'moment';

import type { TimeRange, NoTimeRangeOverride } from 'views/logic/queries/Query';
import StoreProvider from 'injection/StoreProvider';

type Props = {
  timerange: TimeRange | NoTimeRangeOverride | null | undefined,
};

export const EMPTY_RANGE = '----/--/-- --:--:--.---';
export const EMPTY_OUTPUT = { from: EMPTY_RANGE, until: EMPTY_RANGE };

const ToolsStore = StoreProvider.getStore('Tools');

const TimeRangeWrapper = styled.p(({ theme }) => css`
  width: 100%;
  padding: 3px 9px;
  margin: 0 0 0 12px;
  display: flex;
  justify-content: space-around;
  background-color: ${theme.colors.variant.lightest.primary};
  align-items: center;
  border-radius: 4px;

  > span {
    flex: 1;
  }

  code {
    color: ${theme.colors.variant.darker.primary};
    background: transparent;
    font-size: ${theme.fonts.size.body};
  }
`);

const dateOutput = (timerange: TimeRange) => {
  let from = EMPTY_RANGE;

  if (!timerange) {
    return EMPTY_OUTPUT;
  }

  switch (timerange.type) {
    case 'relative':
      from = !timerange.range ? 'All Time' : moment()
        .subtract(timerange.range * 1000)
        .fromNow();

      return {
        from,
        until: 'Now',
      };

    case 'absolute':
    case 'keyword':
      return { from: timerange.from, until: timerange.to };
    default:
      throw new Error('Invalid Timerange Type');
  }
};

const TimeRangeDisplay = ({ timerange }: Props) => {
  const [{ from, until }, setTimeOutput] = useState(EMPTY_OUTPUT);
  const dateTested = useRef(false);

  useEffect(() => {
    if (timerange && 'type' in timerange && timerange.type === 'keyword' && !timerange.from) {
      if (!dateTested.current) {
        ToolsStore.testNaturalDate(timerange.keyword)
          .then((response) => {
            dateTested.current = true;

            setTimeOutput({
              from: response.from,
              until: response.to,
            });
          }, () => {
            setTimeOutput(EMPTY_OUTPUT);
          });
      }
    } else if (timerange && 'type' in timerange) {
      setTimeOutput(dateOutput(timerange));
    }
  }, [dateTested, timerange]);

  return (
    <TimeRangeWrapper>
      {!(timerange && 'type' in timerange)
        ? <span><code>No Override</code></span>
        : (
          <>
            <span><strong>From</strong>: <code>{from}</code></span>
            <span><strong>Until</strong>: <code>{until}</code></span>
          </>
        )}
    </TimeRangeWrapper>
  );
};

export default TimeRangeDisplay;