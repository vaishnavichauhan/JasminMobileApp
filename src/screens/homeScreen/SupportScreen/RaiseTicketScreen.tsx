import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { styles } from './RaiseTicketScreenStyles';
import Header from '../../../components/Header/Header';
import { colors } from '../../../styles/variables';
import {
  getSubTicketTypesApi,
  createTicketApi,
  TicketTypeItem,
  SubTicketTypeItem,
} from '../../../api/ticketsApi';

export interface ImageAttachment {
  id: string;
  uri: string;
  name: string;
  type: string;
  sizeText?: string;
}

export const RaiseTicketScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // API Data States
  const [loadingOptions, setLoadingOptions] = useState<boolean>(true);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeItem[]>([]);
  const [subTicketTypes, setSubTicketTypes] = useState<SubTicketTypeItem[]>([]);

  // Form Field States
  const [selectedTicketType, setSelectedTicketType] = useState<TicketTypeItem | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<SubTicketTypeItem | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [images, setImages] = useState<ImageAttachment[]>([]);

  // Validation Error States (inline error messages under each input)
  const [errors, setErrors] = useState<{
    ticketType?: string;
    subType?: string;
    title?: string;
    description?: string;
  }>({});

  // UI Modal States
  const [ticketTypeModalVisible, setTicketTypeModalVisible] = useState<boolean>(false);
  const [subTypeModalVisible, setSubTypeModalVisible] = useState<boolean>(false);
  const [uploadModalVisible, setUploadModalVisible] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [remarkCopied, setRemarkCopied] = useState<boolean>(false);

  useEffect(() => {
    loadDropdownOptions();
  }, []);

  const loadDropdownOptions = async () => {
    setLoadingOptions(true);
    try {
      const data = await getSubTicketTypesApi();
      setTicketTypes(data.ticket_types || []);
      setSubTicketTypes(data.sub_ticket_types || []);
    } catch (err) {
      console.warn('Error loading ticket options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleBack = () => {
    if (navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation && navigation.navigate) {
      try {
        navigation.navigate('Support');
      } catch (e) {
        navigation.navigate('Home', { screen: 'Dashboard' });
      }
    }
  };

  const handleNavigateToTicketsList = () => {
    try {
      navigation.navigate('AllTicketsScreen');
    } catch (e) {
      navigation.navigate('AllTickets');
    }
  };

  const handleNavigateToSupport = () => {
    try {
      navigation.navigate('Support');
    } catch (e) {
      if (navigation && navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home', { screen: 'Dashboard' });
      }
    }
  };

  // Filter sub-ticket types according to selected parent ticket type
  const filteredSubTypes = selectedTicketType
    ? subTicketTypes.filter((st) => st.ticket_type_id === selectedTicketType.id)
    : [];

  const handleSelectTicketType = (item: TicketTypeItem) => {
    setSelectedTicketType(item);
    setSelectedSubType(null); // Reset sub type when parent changes
    setRemarkCopied(false);
    setErrors((prev) => ({ ...prev, ticketType: undefined }));
    setTicketTypeModalVisible(false);
  };

  const handleSelectSubType = (item: SubTicketTypeItem) => {
    setSelectedSubType(item);
    setRemarkCopied(false);
    setErrors((prev) => ({ ...prev, subType: undefined }));
    setSubTypeModalVisible(false);
  };

  const handleCopyRemark = (text: string) => {
    try {
      Clipboard.setString(text);
      setRemarkCopied(true);
      setTimeout(() => {
        setRemarkCopied(false);
      }, 2000);
    } catch (err) {
      console.warn('Failed to copy remark to clipboard:', err);
    }
  };

  // Pick images from gallery using react-native-image-picker (supports multiple, max 5)
  const handlePickFromGallery = async () => {
    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      Alert.alert('Upload Limit', 'You have already attached the maximum of 5 images.');
      setUploadModalVisible(false);
      return;
    }

    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: remainingSlots,
        includeBase64: false,
        quality: 0.8,
      });

      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Image Picker Error', response.errorMessage || 'Failed to select image.');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const newImages: ImageAttachment[] = response.assets.map((asset, index) => {
          const sizeMB = asset.fileSize
            ? `${(asset.fileSize / (1024 * 1024)).toFixed(2)} MB`
            : 'Photo';
          return {
            id: `img_${Date.now()}_${index}_${Math.random().toString(36).substring(7)}`,
            uri: asset.uri || '',
            name: asset.fileName || `ticket_${Date.now()}_${index + 1}.jpg`,
            type: asset.type || 'image/jpeg',
            sizeText: sizeMB,
          };
        });

        setImages((prev) => [...prev, ...newImages].slice(0, 5));
      }
    } catch (err: any) {
      console.warn('Error launching image library:', err);
      Alert.alert('Error', 'Unable to open photo library.');
    } finally {
      setUploadModalVisible(false);
    }
  };

  // Capture photo with camera using react-native-image-picker
  const handleTakePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Upload Limit', 'You have already attached the maximum of 5 images.');
      setUploadModalVisible(false);
      return;
    }

    try {
      const response = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Camera Error', response.errorMessage || 'Failed to take photo.');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const sizeMB = asset.fileSize
          ? `${(asset.fileSize / (1024 * 1024)).toFixed(2)} MB`
          : 'Photo';
        const newImage: ImageAttachment = {
          id: `cam_${Date.now()}`,
          uri: asset.uri || '',
          name: asset.fileName || `camera_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          sizeText: sizeMB,
        };

        setImages((prev) => [...prev, newImage].slice(0, 5));
      }
    } catch (err: any) {
      console.warn('Error launching camera:', err);
      Alert.alert('Error', 'Unable to launch camera.');
    } finally {
      setUploadModalVisible(false);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const handleClearForm = () => {
    setSelectedTicketType(null);
    setSelectedSubType(null);
    setTitle('');
    setDescription('');
    setRemarks('');
    setImages([]);
    setErrors({});
  };

  const handleSubmit = async () => {
    // Validate required fields and show inline error message below each field
    const newErrors: {
      ticketType?: string;
      subType?: string;
      title?: string;
      description?: string;
    } = {};

    if (!selectedTicketType) {
      newErrors.ticketType = 'Please select a Ticket Type';
    }

    if (!selectedSubType) {
      newErrors.subType = 'Please select a Sub Ticket Type';
    }

    if (!title.trim()) {
      newErrors.title = 'Please provide a Title for the ticket';
    }

    if (!description.trim()) {
      newErrors.description = 'The Describe the Issue field is required';
    }

    if (Object.keys(newErrors).length > 0 || !selectedTicketType || !selectedSubType) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ticket_type_id', String(selectedTicketType.id));
      formData.append('sub_ticket_type_id', String(selectedSubType.id));
      formData.append('title', title.trim());
      formData.append('description', description.trim());

      if (remarks.trim()) {
        formData.append('remarks', remarks.trim());
      }

      // Append up to 5 images
      images.slice(0, 5).forEach((img, idx) => {
        formData.append('images', {
          uri: img.uri,
          type: img.type || 'image/jpeg',
          name: img.name || `ticket_image_${idx + 1}.jpg`,
        } as any);
      });

      const response = await createTicketApi(formData);

      if (response?.success) {
        Alert.alert(
          'Success',
          'Successfully Ticket Created',
          [
            {
              text: 'OK',
              onPress: () => {
                handleClearForm();
                handleNavigateToSupport();
              },
            },
          ],
          {
            cancelable: false,
          }
        );
      } else {
        Alert.alert(
          'Submission Failed',
          response?.message || 'Something went wrong while submitting the ticket.'
        );
      }
    } catch (err: any) {
      console.error('Submit ticket error:', err);
      Alert.alert('Error', err?.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header matching web bar */}
      <Header
        title="Raise a Support Ticket"
        showBack={true}
        onBackPress={handleBack}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
      />

      <View style={styles.mainContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* 1. TICKET TYPE * */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>
                Ticket Type <Text style={styles.requiredStar}>*</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.selectInput,
                errors.ticketType && styles.inputErrorBorder,
              ]}
              activeOpacity={0.7}
              onPress={() => setTicketTypeModalVisible(true)}
            >
              {loadingOptions ? (
                <Text style={styles.selectPlaceholderText}>Loading ticket types...</Text>
              ) : selectedTicketType ? (
                <Text style={styles.selectInputText}>{selectedTicketType.name}</Text>
              ) : (
                <Text style={styles.selectPlaceholderText}>-- Select Ticket Type --</Text>
              )}
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
            {errors.ticketType ? (
              <Text style={styles.errorText}>{errors.ticketType}</Text>
            ) : null}
          </View>

          {/* 2. SUB TICKET TYPE * */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>
                Sub Ticket Type <Text style={styles.requiredStar}>*</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.selectInput,
                !selectedTicketType && styles.selectInputDisabled,
                errors.subType && styles.inputErrorBorder,
              ]}
              activeOpacity={selectedTicketType ? 0.7 : 1}
              onPress={() => {
                if (!selectedTicketType) {
                  setErrors((prev) => ({
                    ...prev,
                    ticketType: 'Please select a Ticket Type first',
                  }));
                  return;
                }
                setSubTypeModalVisible(true);
              }}
            >
              {!selectedTicketType ? (
                <Text style={styles.selectPlaceholderText}>
                  -- Select Ticket Type First --
                </Text>
              ) : selectedSubType ? (
                <Text style={styles.selectInputText}>{selectedSubType.name}</Text>
              ) : (
                <Text style={styles.selectPlaceholderText}>
                  -- Select Sub Ticket Type --
                </Text>
              )}
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
            {errors.subType ? (
              <Text style={styles.errorText}>{errors.subType}</Text>
            ) : null}

            {/* Sub Ticket Type Remark (Displayed when sub-ticket type is selected and remark exists) */}
            {selectedSubType?.remark && selectedSubType.remark.trim() ? (
              <View style={styles.subTypeRemarkBox}>
                <View style={styles.subTypeRemarkHeader}>
                  <View style={styles.subTypeRemarkTitleRow}>
                    <Text style={styles.subTypeRemarkIcon}>💬</Text>
                    <Text style={styles.subTypeRemarkTitle}>Remark</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.copyBtn, remarkCopied && styles.copyBtnCopied]}
                    activeOpacity={0.7}
                    onPress={() => handleCopyRemark(selectedSubType.remark || '')}
                  >
                    <Text style={{ fontSize: 11 }}>{remarkCopied ? '✓' : '📋'}</Text>
                    <Text
                      style={[
                        styles.copyBtnText,
                        remarkCopied && styles.copyBtnTextCopied,
                      ]}
                    >
                      {remarkCopied ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.subTypeRemarkText} selectable={true}>
                  {selectedSubType.remark}
                </Text>
              </View>
            ) : null}
          </View>

          {/* 3. TITLE * */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>
                Title <Text style={styles.requiredStar}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[
                styles.textInput,
                errors.title && styles.inputErrorBorder,
              ]}
              placeholder=""
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={(val) => {
                setTitle(val);
                if (val.trim() && errors.title) {
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
            />
            {errors.title ? (
              <Text style={styles.errorText}>{errors.title}</Text>
            ) : null}
          </View>

          {/* 4. DESCRIBE THE ISSUE * */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>
                Describe the Issue <Text style={styles.requiredStar}>*</Text>
              </Text>
            </View>
            <TextInput
              style={[
                styles.textAreaInput,
                { minHeight: 110 },
                errors.description && styles.inputErrorBorder,
              ]}
              placeholder=""
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={(val) => {
                setDescription(val);
                if (val.trim() && errors.description) {
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              multiline
              numberOfLines={4}
            />
            {errors.description ? (
              <Text style={styles.errorText}>{errors.description}</Text>
            ) : null}
          </View>

          {/* 5. ATTACH IMAGES (MULTIPLE, MAX 5) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Attach Images</Text>
              <Text style={styles.countBadge}>{images.length} of 5 attached</Text>
            </View>

            {/* Upload Dashed Container */}
            <TouchableOpacity
              style={styles.uploadContainer}
              activeOpacity={0.7}
              onPress={() => {
                if (images.length >= 5) {
                  Alert.alert('Upload Limit', 'Maximum 5 images already attached.');
                  return;
                }
                setUploadModalVisible(true);
              }}
            >
              <View style={styles.uploadIconCircle}>
                <Text style={styles.uploadIconText}>+</Text>
              </View>
              <Text style={styles.uploadTitle}>
                Click to upload images here
              </Text>
              <Text style={styles.uploadSubtitle}>
                PNG, JPG, JPEG or WEBP (Max 5 images, up to 10MB each)
              </Text>
            </TouchableOpacity>

            {/* Image Preview List (Only image and top-right corner cancel icon) */}
            {images.length > 0 && (
              <View style={styles.imagesList}>
                {images.map((img) => (
                  <View key={img.id} style={styles.imageThumbCard}>
                    <Image
                      source={{ uri: img.uri }}
                      style={styles.imageThumbImg}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      activeOpacity={0.8}
                      onPress={() => handleRemoveImage(img.id)}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 6. REMARKS (OPTIONAL) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Remarks</Text>
            </View>
            <TextInput
              style={[styles.textAreaInput, { minHeight: 75 }]}
              placeholder=""
              placeholderTextColor="#94A3B8"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Bottom Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.clearBtn}
              activeOpacity={0.7}
              onPress={handleClearForm}
              disabled={submitting}
            >
              <Text style={styles.clearBtnText}>Clear Form</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              activeOpacity={0.8}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color={colors.white} style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Submitting...</Text>
                </>
              ) : (
                <Text style={styles.submitBtnText}>Submit Ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Ticket Type Picker Modal */}
      <Modal
        visible={ticketTypeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTicketTypeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTicketTypeModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Ticket Type</Text>
              <TouchableOpacity onPress={() => setTicketTypeModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={ticketTypes}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => {
                const isSelected = selectedTicketType?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => handleSelectTicketType(item)}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>No ticket types found.</Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sub Ticket Type Picker Modal */}
      <Modal
        visible={subTypeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSubTypeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSubTypeModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sub Ticket Type</Text>
              <TouchableOpacity onPress={() => setSubTypeModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredSubTypes}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => {
                const isSelected = selectedSubType?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => handleSelectSubType(item)}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {item.assigned_names ? (
                      <Text style={styles.modalItemSub}>
                        Resolvers: {item.assigned_names}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>
                  No sub ticket types found for this type.
                </Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Upload Image Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setUploadModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Image</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ padding: 18 }}>
              <TouchableOpacity
                style={styles.uploadModalBtn}
                activeOpacity={0.7}
                onPress={handlePickFromGallery}
              >
                <Text style={styles.uploadModalBtnIcon}>🖼️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadModalBtnText}>
                    Choose from Gallery
                  </Text>
                  <Text style={styles.uploadModalBtnSub}>
                    Select multiple photos from device (up to {5 - images.length} remaining)
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadModalBtn}
                activeOpacity={0.7}
                onPress={handleTakePhoto}
              >
                <Text style={styles.uploadModalBtnIcon}>📷</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadModalBtnText}>
                    Take Photo with Camera
                  </Text>
                  <Text style={styles.uploadModalBtnSub}>
                    Capture photo directly using device camera
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default RaiseTicketScreen;
