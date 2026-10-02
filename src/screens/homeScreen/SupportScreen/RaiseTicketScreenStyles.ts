import { StyleSheet, Platform } from 'react-native';
import {
  colors,
  fontSize,
  fontFamily,
  marginHorizontal,
  borderRadius,
} from '../../../styles/variables';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  headerStyle: {
    backgroundColor: colors.primary,
    borderBottomWidth: 0,
  },
  headerTitleStyle: {
    color: colors.white,
    fontSize: 17,
    fontFamily: fontFamily.bold,
  },
  ticketsListBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 6,
  },
  ticketsListBtnText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fontFamily.bold,
  },

  /* ── Content Card ── */
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: marginHorizontal.normal,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
  },

  /* ── Sub Header Bar ── */
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  mandatoryNote: {
    fontSize: 11.5,
    fontFamily: fontFamily.regular,
    color: '#DC2626',
  },

  /* ── Form Fields ── */
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredStar: {
    color: '#DC2626',
    fontFamily: fontFamily.bold,
  },
  countBadge: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#64748B',
  },

  /* ── Inputs & Selectors ── */
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
  },
  selectInputDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  selectInputText: {
    fontSize: 13.5,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
    flex: 1,
  },
  selectPlaceholderText: {
    fontSize: 13.5,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    flex: 1,
  },
  selectArrow: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 8,
  },

  /* ── Sub Ticket Type Remark Box ── */
  subTypeRemarkBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 8,
  },
  subTypeRemarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subTypeRemarkTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subTypeRemarkIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  subTypeRemarkTitle: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
    marginLeft: 4,
  },
  copyBtnCopied: {
    backgroundColor: '#DCFCE7',
  },
  copyBtnTextCopied: {
    color: '#16A34A',
  },
  subTypeRemarkText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#1E293B',
    lineHeight: 18,
  },

  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
  },
  textAreaInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#EF4444',
    marginTop: 5,
    marginLeft: 2,
  },

  /* ── Upload Area ── */
  uploadContainer: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadIconText: {
    fontSize: 20,
    color: '#7C3AED',
  },
  uploadTitle: {
    fontSize: 13.5,
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
    textAlign: 'center',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 11.5,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
    textAlign: 'center',
  },

  /* ── Image Previews ── */
  imagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imageThumbCard: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageThumbImg: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  removeImageText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: fontFamily.bold,
    lineHeight: 12,
  },

  /* ── Action Buttons ── */
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    marginBottom: 20,
    gap: 12,
  },
  clearBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#475569',
  },
  submitBtn: {
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },

  /* ── Modal Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 64,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748B',
    padding: 4,
  },
  modalList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemSelected: {
    backgroundColor: '#EDE9FE',
  },
  modalItemText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: '#1E293B',
  },
  modalItemTextSelected: {
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
  },
  modalItemSub: {
    fontSize: 11.5,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  emptyModalText: {
    textAlign: 'center',
    padding: 24,
    color: '#94A3B8',
    fontSize: 13,
  },

  /* Upload Modal Options */
  uploadModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  uploadModalBtnIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  uploadModalBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
  },
  uploadModalBtnSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
});

export default styles;
