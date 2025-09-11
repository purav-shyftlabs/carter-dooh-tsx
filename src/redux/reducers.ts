import { combineReducers } from 'redux';
import { User } from 'types';
import { CarterDialogProps } from 'shyftlabs-dsl';
import { AGENT, defaultConfigs, IAppConfigs } from '@/common/constants';
import { AlertProps, REDUX_ACTION } from '@/types/common';
import { CarterPopupProps } from '@/components/carter-popup/carter-popup.types';
import * as types from './types';

export interface ICommonState {
  loader: boolean;
  sidebar: boolean;
  notificationDrawer: boolean;
  agent: AGENT;
  search: boolean;
  message: string;
  dialog?: CarterDialogProps;
  popup?: CarterPopupProps;
  alerts?: Array<AlertProps>;
  configs: IAppConfigs;
  user: User;
}

export interface ISegmentState {
  segments: any[];
  segmentCount: number;
  page: number | null;
  pageSize: number | null;
  search: string;
  sort: string;
  filter: any[];
  executingQueries: { [key: string]: string };
  nodeNames: { [key: string]: string };
  editStatus: boolean;
  userCreatingProjectId: string;
  isInitialLoading: boolean;
}

export interface IRootState {
  common: ICommonState;
  segment: ISegmentState;
}

const COMMON_INITIAL_STATE: ICommonState = {
  loader: true,
  sidebar: false,
  notificationDrawer: false,
  agent: AGENT.WEB,
  search: false,
  message: '',
  configs: defaultConfigs,
  user: {} as User,
  dialog: undefined,
  popup: undefined,
  alerts: [],
};

const SEGMENTS_INITIAL_STATE: ISegmentState = {
  segments: [],
  segmentCount: 0,
  page: null,
  pageSize: null,
  search: '',
  sort: '',
  filter: [],
  executingQueries: {},
  nodeNames: {},
  editStatus: false,
  userCreatingProjectId: '',
  isInitialLoading: true,
};

const ROOT_INITIAL_STATE: IRootState = {
  common: COMMON_INITIAL_STATE,
  segment: SEGMENTS_INITIAL_STATE,
};

const segmentReducer = (state = SEGMENTS_INITIAL_STATE, action: REDUX_ACTION): ISegmentState => {
  switch (action.type) {
    case types.SET_SEGMENTS:
      return {
        ...state,
        segments: action.payload.segments,
        segmentCount: action.payload.segmentCount,
      };
    case types.UPDATE_SEGMENT:
      return {
        ...state,
        segments: state.segments.map((segment, index) =>
          index === action.payload.index ? action.payload.segment : segment,
        ),
      };
    case types.DELETE_SEGMENT:
      return {
        ...state,
        segments: state.segments.filter((_, index) => index !== action.payload.index),
        segmentCount: state.segmentCount - 1,
      };
    case types.UPDATE_NODE_NAMES:
      return {
        ...state,
        nodeNames: {
          ...state.nodeNames,
          [action.payload.nodeId]: action.payload.nodeName,
        },
      };
    case types.SET_NODE_NAMES:
      return {
        ...state,
        nodeNames: { ...action.payload.nodeNames },
      };
    case types.REMOVE_NODE_NAME_BY_ID:
      const { [action.payload.nodeId]: _, ...nodeNames } = state.nodeNames;
      return {
        ...state,
        nodeNames,
      };
    case types.SET_EDIT_STATUS:
      return {
        ...state,
        editStatus: action.payload.editStatus,
      };
    case types.SET_USER_CREATING_SEGMENT_ID:
      return {
        ...state,
        userCreatingProjectId: action.payload.userCreatingProjectId,
      };
    case types.RESET_CANVAS:
      return SEGMENTS_INITIAL_STATE;
    default:
      return state;
  }
};

const commonReducer = (state = COMMON_INITIAL_STATE, action: REDUX_ACTION) => {
  const { type, payload } = action;
  switch (type) {
    case types.TOGGLE_LOADER:
      return { ...state, loader: payload };
    case types.TOGGLE_SIDEBAR:
      return { ...state, sidebar: payload };
    case types.TOGGLE_NOTIFICATION_DRAWER:
      return { ...state, notificationDrawer: payload };
    case types.SET_AGENT:
      return { ...state, agent: payload };
    case types.SET_APP_CONFIGS:
      return { ...state, configs: payload };
    case types.TOGGLE_SEARCH:
      return { ...state, search: payload };
    case types.SET_MESSAGE:
      return { ...state, message: payload };
    case types.SET_DIALOG:
      return { ...state, dialog: payload };
    case types.REMOVE_DIALOG:
      return { ...state, dialog: undefined };
    case types.SET_POPUP:
      return {
        ...state,
        popup: payload,
      };
    case types.REMOVE_POPUP:
      return { ...state, popup: undefined };
    case types.SET_ALERT:
      const id = payload.id ?? Date.now();
      const toastsPack = state.alerts ?? [];
      if (toastsPack?.find(toastItem => toastItem.id === id)) {
        return { ...state };
      }
      const rest = toastsPack.length < 5 ? toastsPack : toastsPack.slice(0, -1);
      return { ...state, alerts: [{ ...payload, id }, ...rest] };
    case types.REMOVE_ALERT:
      return { ...state, alerts: state.alerts?.filter(toast => toast.id !== payload) };
    case types.SET_USER:
      return { ...state, user: payload };
    default:
      return state;
  }
};

const combine = {
  common: commonReducer,
  segment: segmentReducer,
};

const appReducer = combineReducers(combine);
const reducers = (state: IRootState = ROOT_INITIAL_STATE, action: REDUX_ACTION) => {
  if (action.type === types.RESET_REDUX) {
    return appReducer({ common: state?.common, segment: SEGMENTS_INITIAL_STATE }, action);
  }

  return appReducer(state, action);
};

export default reducers;
