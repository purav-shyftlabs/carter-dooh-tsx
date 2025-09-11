import { CarterDialogProps } from 'shyftlabs-dsl';
import { User } from 'types';
import { initializeStore } from '@/redux/store';
import { IAppConfigs } from '@/common/constants';
import { AlertProps } from '@/types/common';
import { CarterPopupProps } from '@/components/carter-popup/carter-popup.types';
import { AGENT } from '../common/constants';
import * as types from './types';

const store = initializeStore();

export const showLoader = (payload: boolean) => {
  store.dispatch({
    type: types.TOGGLE_LOADER,
    payload,
  });
};

export const setAgent = (payload: AGENT) => {
  store.dispatch({
    type: types.SET_AGENT,
    payload,
  });
};

export const setAppConfigs = (payload: IAppConfigs) => {
  store.dispatch({
    type: types.SET_APP_CONFIGS,
    payload,
  });
};

export const resetRedux = () => {
  store.dispatch({
    type: types.RESET_REDUX,
  });
};

export const toggleSearch = (payload: boolean) => {
  store.dispatch({
    type: types.TOGGLE_SEARCH,
    payload,
  });
};

export const showMessage = (payload: string) => {
  store.dispatch({
    type: types.SET_MESSAGE,
    payload,
  });
};

export const showAlert = (payload: AlertProps) => {
  store.dispatch({
    type: types.SET_ALERT,
    payload,
  });
};

export const removeAlert = (payload: string) => {
  store.dispatch({
    type: types.REMOVE_ALERT,
    payload,
  });
};

export const showDialog = (payload: CarterDialogProps) => {
  store.dispatch({
    type: types.SET_DIALOG,
    payload,
  });
};

export const showPopup = (payload: CarterPopupProps) => {
  store.dispatch({
    type: types.SET_POPUP,
    payload,
  });
};

export const closePopup = () => {
  store.dispatch({
    type: types.REMOVE_POPUP,
  });
};

export const closeDialog = () => {
  store.dispatch({
    type: types.REMOVE_DIALOG,
  });
};

export const setUser = (payload: User) => {
  store.dispatch({
    type: types.SET_USER,
    payload,
  });
};

export const toggleSidebar = (payload: boolean) => {
  store.dispatch({
    type: types.TOGGLE_SIDEBAR,
    payload,
  });
};

export const toggleNotificationDrawer = (payload: boolean) => {
  store.dispatch({
    type: types.TOGGLE_NOTIFICATION_DRAWER,
    payload,
  });
};

// segment actions

export const setSegments = (segments: any[], segmentCount: number) => {
  store.dispatch({
    type: types.SET_SEGMENTS,
    payload: { segments, segmentCount },
  });
};

export const updateSegment = (index: number, segment: any) =>
  store.dispatch({
    type: types.UPDATE_SEGMENT,
    payload: { index, segment },
  });

export const deleteSegment = (index: number) =>
  store.dispatch({
    type: types.DELETE_SEGMENT,
    payload: { index },
  });

export const updateNodeNames = (nodeId: string, nodeName: string) =>
  store.dispatch({
    type: types.UPDATE_NODE_NAMES,
    payload: { nodeId, nodeName },
  });

export const setNodeNames = (nodeNames: { [key: string]: string }) =>
  store.dispatch({
    type: types.SET_NODE_NAMES,
    payload: { nodeNames },
  });

export const removeNodeNameById = (nodeId: string) =>
  store.dispatch({
    type: types.REMOVE_NODE_NAME_BY_ID,
    payload: { nodeId },
  });

export const setEditStatus = (editStatus: boolean) =>
  store.dispatch({
    type: types.SET_EDIT_STATUS,
    payload: { editStatus },
  });

export const setUserCreatingProjectStatus = (userCreatingProjectId: string) =>
  store.dispatch({
    type: types.SET_USER_CREATING_SEGMENT_ID,
    payload: { userCreatingProjectId },
  });

export const reset = () =>
  store.dispatch({
    type: types.RESET_CANVAS,
  });
