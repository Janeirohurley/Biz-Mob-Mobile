import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Crypto from "expo-crypto";
import { useBusiness } from "../context/BusinessContext";

interface StepInfo {
  title: string;
  description: string;
  illustration: string | number;
}

interface Currency {
  id: string;
  label: string;
  currencySymbol: string;
}

interface Errors {
  [key: string]: string | undefined;
}

export default function SignupMultiStep() {
  const router = useRouter();
  const { setConfig } = useBusiness();
  const totalSteps = 5;
  const [step, setStep] = useState<number>(1);

  // Form states
  const [businessName, setBusinessName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [currency, setCurrency] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");

  const [errors, setErrors] = useState<Errors>({});
  const [isStepValid, setIsStepValid] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Animation for PIN shake
  const shakeAnimation = new Animated.Value(0);



  const getImageSource = (illustration: string | number) => {
    return typeof illustration === "string" ? { uri: illustration } : illustration;
  };

  const currencyOptions: Currency[] = [
    { id: "1", label: "USD", currencySymbol: "$" },
    { id: "2", label: "EUR", currencySymbol: "€" },
    { id: "3", label: "BIF", currencySymbol: "FBu" },
  ];

  const languageOptions: { id: string; label: string }[] = [
    { id: "1", label: "English" },
    { id: "2", label: "Français" },
  ];

  const stepInfo: StepInfo[] = [
    {
      title: "Business Information",
      description:
        "Provide your business name and username to personalize your experience.",
      illustration: require("../assets/images/business_info.png"),
    },
    {
      title: "Set Your PIN",
      description:
        "Create a secure 6-digit PIN to protect your account.",
      illustration: require("../assets/images/secure-lock.png"),
    },
    {
      title: "Confirm Your PIN",
      description:
        "Re-enter your PIN to confirm.",
      illustration: require("../assets/images/secure-lock.png"),
    },
    {
      title: "Preferences",
      description: "Select your preferred currency and language for your dashboard.",
      illustration: require("../assets/images/preferences.png"),
    },
    {
      title: "Review & Confirm",
      description: "Review your details before creating your account.",
      illustration: require("../assets/images/review.png"),
    },
  ];

  useEffect(() => {
    const validateStep = (): boolean => {
      const newErrors: Errors = {};
      let valid = true;

      switch (step) {
        case 1:
          if (!businessName || businessName.length < 3) {
            newErrors.businessName = "Business name must be at least 3 characters";
            valid = false;
          }
          if (!userName || !/^[a-zA-Z0-9_]{3,}$/.test(userName)) {
            newErrors.userName = "Username must be at least 3 characters and contain only letters, numbers, or underscores";
            valid = false;
          }
          break;
        case 2:
          // Step 2: Enter PIN (6 digits required)
          valid = pin.length === 6;
          break;
        case 3:
          // Step 3: Confirm PIN (must match)
          if (confirmPin.length === 6 && pin === confirmPin) {
            valid = true;
          } else {
            valid = false;
          }
          break;
        case 4:
          if (!currency) {
            newErrors.currency = "Please select a currency";
            valid = false;
          }
          if (!language) {
            newErrors.language = "Please select a language";
            valid = false;
          }
          break;
      }

      setErrors(newErrors);
      return valid;
    };

    setIsStepValid(validateStep());
  }, [step, businessName, userName, currency, language, pin, confirmPin]);



  const triggerShakeAnimation = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handlePinInput = (digit: string) => {
    if (step === 2) {
      // Step 2: Enter PIN
      if (pin.length < 6) {
        const newPin = pin + digit;
        setPin(newPin);
        // Auto-advance to confirmation when PIN is complete
        if (newPin.length === 6) {
          setTimeout(() => {
            goNext();
          }, 300);
        }
      }
    } else if (step === 3) {
      // Step 3: Confirm PIN
      if (confirmPin.length < 6) {
        const newConfirmPin = confirmPin + digit;
        setConfirmPin(newConfirmPin);
        // Auto-advance when confirmation PIN is complete
        if (newConfirmPin.length === 6) {
          if (pin === newConfirmPin) {
            // PINs match, move to next step after a short delay
            setTimeout(() => {
              goNext();
            }, 300);
          } else {
            // PINs don't match, trigger shake animation and show error
            triggerShakeAnimation();
            setErrors({ confirmPin: "PINs do not match" });
            setTimeout(() => {
              setConfirmPin("");
              setErrors({});
            }, 1000);
          }
        }
      }
    }
  };

  const handlePinDelete = () => {
    if (step === 2) {
      setPin(pin.slice(0, -1));
    } else if (step === 3) {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const goNext = () => {
    if (isStepValid) setStep((s) => Math.min(totalSteps, s + 1));
  };

  const goBack = () => {
    if (step === 3) {
      // Going back from PIN confirmation clears the confirmation
      setConfirmPin("");
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Hash the PIN using SHA256
      const passwordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
      );

      // Get the selected currency details
      const selectedCurrency = currencyOptions.find(c => c.id === currency);
      const finalCurrencyCode = selectedCurrency?.label || "USD";
      const finalSymbol = selectedCurrency?.currencySymbol || "$";

      // Get the selected language
      const selectedLanguage = languageOptions.find(l => l.id === language);
      const finalLanguage: "en" | "fr" | "es" | "ar" = selectedLanguage?.label === "Français" ? "fr" : "en";

      // Create the config object
      setConfig({
        version: 1,
        lastSyncTimestamp: undefined,
        businessName: businessName.trim(),
        userName: userName.trim(),
        passwordHash,
        currencyCode: finalCurrencyCode,
        currencySymbol: finalSymbol,
        currency: finalCurrencyCode,
        language: finalLanguage,
        isRTL: false // English and French are LTR, would be true for Arabic
      });

      // Show success message and redirect to login
      Alert.alert("Success", "Your account has been created!", [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        }
      ]);
    } catch (error) {
      console.error("Error creating account:", error);
      Alert.alert("Error", "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (): React.ReactNode => {
    // Debug: log current step and validation state to help diagnose empty render issues
    // (will appear in Metro/console when running the app)
     
    console.log("renderStepContent: step=", step, "isStepValid=", isStepValid);

    switch (step) {
      // --- Step 1: Business Info ---
      case 1:
        return (
          <>
            <TextInput
              placeholder="Business Name"
              style={[styles.input, errors.businessName && styles.inputError]}
              value={businessName}
              onChangeText={setBusinessName}
            />
            {errors.businessName && <Text style={styles.error}>{errors.businessName}</Text>}

            <TextInput
              placeholder="Username"
              style={[styles.input, errors.userName && styles.inputError]}
              value={userName}
              onChangeText={setUserName}
            />
            {errors.userName && <Text style={styles.error}>{errors.userName}</Text>}
          </>
        );
      case 2:
        // --- Step 2: Enter PIN ---
        return (
          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>Enter a 6-digit PIN</Text>

            {/* PIN Display with 6 circles */}
            <View style={styles.pinDotsContainer}>
              {[...Array(6)].map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    index < pin.length && styles.pinDotFilled,
                  ]}
                />
              ))}
            </View>

            {/* Digital Pad */}
            <View style={styles.digitalPad}>
              <View style={styles.digitalPadRow}>
                {["1", "2", "3"].map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.digitalPadButton}
                    onPress={() => handlePinInput(key)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.digitalPadText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.digitalPadRow}>
                {["4", "5", "6"].map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.digitalPadButton}
                    onPress={() => handlePinInput(key)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.digitalPadText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.digitalPadRow}>
                {["7", "8", "9"].map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.digitalPadButton}
                    onPress={() => handlePinInput(key)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.digitalPadText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.digitalPadRow}>
                <View style={styles.digitalPadButtonEmpty} />
                <TouchableOpacity
                  style={styles.digitalPadButton}
                  onPress={() => handlePinInput("0")}
                  activeOpacity={0.6}
                >
                  <Text style={styles.digitalPadText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.digitalPadButton}
                  onPress={handlePinDelete}
                  activeOpacity={0.6}
                >
                  <Ionicons name="backspace-outline" size={26} color="#1C1C1E" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      case 3:
        // --- Step 3: Confirm PIN ---
        const hasError = errors.confirmPin;

        return (
          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>Confirm your PIN</Text>

            {/* PIN Display with 6 circles */}
            <Animated.View
              style={[
                styles.pinDotsContainer,
                { transform: [{ translateX: shakeAnimation }] }
              ]}
            >
              {[...Array(6)].map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    index < confirmPin.length && !hasError && styles.pinDotFilled,
                    index < confirmPin.length && hasError && styles.pinDotError,
                  ]}
                />
              ))}
            </Animated.View>

            {errors.confirmPin && <Text style={styles.error}>{errors.confirmPin}</Text>}

            {/* Digital Pad */}
            <View style={styles.digitalPad}>
              <View style={styles.digitalPadRow}>
                {["1", "2", "3"].map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.digitalPadButton}
                    onPress={() => handlePinInput(key)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.digitalPadText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.digitalPadRow}>
                {["4", "5", "6"].map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.digitalPadButton}
                    onPress={() => handlePinInput(key)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.digitalPadText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.digitalPadRow}>
                {["7", "8", "9"].map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.digitalPadButton}
                    onPress={() => handlePinInput(key)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.digitalPadText}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.digitalPadRow}>
                <View style={styles.digitalPadButtonEmpty} />
                <TouchableOpacity
                  style={styles.digitalPadButton}
                  onPress={() => handlePinInput("0")}
                  activeOpacity={0.6}
                >
                  <Text style={styles.digitalPadText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.digitalPadButton}
                  onPress={handlePinDelete}
                  activeOpacity={0.6}
                >
                  <Ionicons name="backspace-outline" size={26} color="#1C1C1E" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      // --- Step 4: Preferences ---
      case 4:
        return (
          <View style={styles.preferencesContainer}>
            {/* Currency Selection */}
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceTitle}>Select Currency</Text>
              <View style={styles.buttonGrid}>
                {currencyOptions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.gridButton,
                      currency === item.id && styles.gridButtonSelected,
                    ]}
                    onPress={() => setCurrency(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.gridButtonSymbol}>{item.currencySymbol}</Text>
                    <Text
                      style={[
                        styles.gridButtonText,
                        currency === item.id && styles.gridButtonTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.currency && <Text style={styles.error}>{errors.currency}</Text>}
            </View>

            {/* Language Selection */}
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceTitle}>Select Language</Text>
              <View style={styles.buttonGrid}>
                {languageOptions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.gridButton,
                      language === item.id && styles.gridButtonSelected,
                    ]}
                    onPress={() => setLanguage(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.gridButtonTextLarge,
                        language === item.id && styles.gridButtonTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.language && <Text style={styles.error}>{errors.language}</Text>}
            </View>
          </View>
        );
      // --- Step 5: Review & Confirm ---
      case 5:
        return (
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewTitle}>Review Your Information</Text>
            <Text style={styles.reviewSubtitle}>Please confirm your details before proceeding.</Text>

            <View style={styles.reviewItem}>
              <Ionicons name="business" size={24} color="#007AFF" />
              <View style={styles.reviewTextContainer}>
                <Text style={styles.reviewLabel}>Business Name</Text>
                <Text style={styles.reviewValue}>{businessName}</Text>
              </View>
            </View>

            <View style={styles.reviewItem}>
              <Ionicons name="person" size={24} color="#007AFF" />
              <View style={styles.reviewTextContainer}>
                <Text style={styles.reviewLabel}>Username</Text>
                <Text style={styles.reviewValue}>{userName}</Text>
              </View>
            </View>

            <View style={styles.reviewItem}>
              <Ionicons name="cash" size={24} color="#007AFF" />
              <View style={styles.reviewTextContainer}>
                <Text style={styles.reviewLabel}>Currency</Text>
                <Text style={styles.reviewValue}>{currencyOptions.find(c => c.id === currency)?.label || currency}</Text>
              </View>
            </View>

            <View style={styles.reviewItem}>
              <Ionicons name="language" size={24} color="#007AFF" />
              <View style={styles.reviewTextContainer}>
                <Text style={styles.reviewLabel}>Language</Text>
                <Text style={styles.reviewValue}>{languageOptions.find(l => l.id === language)?.label || language}</Text>
              </View>
            </View>
          </View>
        );

      default:
         
        console.warn("renderStepContent: unexpected step value:", step);
        // fallback visuel pour debug au lieu de null
        return (
          <View style={{ padding: 16, backgroundColor: "#fff", borderRadius: 12 }}>
            <Text style={{ color: "#000", marginBottom: 8 }}>Étape invalide ({step})</Text>
            <TouchableOpacity onPress={() => setStep(1)} style={{ backgroundColor: "#007AFF", padding: 10, borderRadius: 8, alignItems: "center" }}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>Retour à l&apos;étape 1</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image source={getImageSource(stepInfo[step - 1].illustration)} style={styles.image} />
            <Text style={styles.title}>{stepInfo[step - 1].title}</Text>
            <Text style={styles.desc}>{stepInfo[step - 1].description}</Text>
          </View>

          {renderStepContent()}

          {/* Footer intégré dans le ScrollView */}
          <View style={styles.footer}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={goBack}
                disabled={isSubmitting}
              >
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextButton,
                (!isStepValid || isSubmitting) && { backgroundColor: "#B0B0B0" }
              ]}
              disabled={!isStepValid || isSubmitting}
              onPress={step === totalSteps ? handleFinish : goNext}
            >
              <Text style={styles.nextText}>
                {isSubmitting ? "Creating..." : (step === totalSteps ? "Validate" : "Next")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9FB" },
  scroll: { padding: 20, paddingBottom: 20 },
  header: { alignItems: "center", marginBottom: 20 },
  image: { width: 180, height: 180, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "600", color: "#000" },
  desc: { textAlign: "center", color: "#6e6e73", fontSize: 14, lineHeight: 20, marginTop: 8 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  inputError: { borderColor: "#FF3B30" },
  error: { color: "#FF3B30", fontSize: 12, marginBottom: 8, textAlign: "left" },

  // PIN Styles
  pinContainer: { alignItems: "center", marginTop: 10 },
  pinLabel: { fontSize: 17, fontWeight: "500", color: "#1C1C1E", marginBottom: 40, letterSpacing: -0.4 },
  pinDotsContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 50 },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#D1D1D6",
    marginHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDotFilled: {
    backgroundColor: "#1C1C1E",
  },
  pinDotError: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30",
  },

  // Digital Pad Styles - iPhone Style
  digitalPad: { marginTop: 20, width: "100%", paddingHorizontal: 40 },
  digitalPadRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  digitalPadButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  digitalPadButtonEmpty: {
    width: 75,
    height: 75,
  },
  digitalPadText: {
    fontSize: 32,
    fontWeight: "300",
    color: "#1C1C1E",
  },

  // Preferences Styles
  preferencesContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },
  preferenceSection: {
    marginBottom: 30,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 16,
    textAlign: "left",
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  },
  gridButton: {
    minWidth: 80,
    height: 40,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    flexDirection:"row",
    gap:5,
  },
  gridButtonSelected: {
    backgroundColor: "#E5F0FF",
    borderColor: "#007AFF",
    borderWidth: 2,
  },
  gridButtonSymbol: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  gridButtonText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6e6e73",
    textAlign: "center",
  },
  gridButtonTextLarge: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    textAlign: "center",
  },
  gridButtonTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },

  reviewContainer: { backgroundColor: "#fff", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, marginTop: 10 },
  reviewTitle: { fontSize: 22, fontWeight: "700", color: "#000", textAlign: "center", marginBottom: 8 },
  reviewSubtitle: { fontSize: 14, color: "#6e6e73", textAlign: "center", marginBottom: 20 },
  reviewItem: { flexDirection: "row", alignItems: "center", marginBottom: 16, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#F9F9FB", borderRadius: 12 },
  reviewTextContainer: { marginLeft: 12, flex: 1 },
  reviewLabel: { fontSize: 12, color: "#6e6e73", textTransform: "uppercase", fontWeight: "600" },
  reviewValue: { fontSize: 16, color: "#000", fontWeight: "500" },
  progressContainer: { height: 6, backgroundColor: "#E5E5EA", borderRadius: 3, marginHorizontal: 20, marginVertical: 12 },
  progressBar: { height: 6, backgroundColor: "#007AFF", borderRadius: 3 },
  footer: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 20, backgroundColor: "#F9F9FB", marginTop: 30 },
  backButton: { flex: 1, backgroundColor: "#E5E5EA", borderRadius: 10, padding: 12, marginRight: 8, alignItems: "center" },
  nextButton: { flex: 1, backgroundColor: "#007AFF", borderRadius: 10, padding: 12, marginLeft: 8, alignItems: "center" },
  backText: { color: "#000", fontWeight: "500" },
  nextText: { color: "#fff", fontWeight: "600" },
});
