import Header from "@/components/header";
import { useBusiness } from "@/context/BusinessContext";
import { Client, Sale, SaleItem } from "@/types/business";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker"; // Import du DateTimePicker
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { default as React, useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CartItem extends SaleItem {
    id: string; // ID temporaire pour le panier
    availableStock: number; // Stock disponible du produit
}

export default function AddSale() {
    const {
        sales,
        clients,
        products,
        addSale,
        setSales,
        getProductById,
        config,
        generateId,
        setProducts,
        setClients,
        addDebt,
        updateDabt,
        debts,
        addClient,
        deleteDebt
    } = useBusiness();
    const route = useRoute();
    const navigation = useNavigation();
    const { saleId } = route.params as { saleId?: string };

    const sale = saleId ? sales.find((s) => s.id === saleId) : null;

    const [clientName, setClientName] = useState(sale?.clientId ? clients.find((c) => c.id === sale.clientId)?.name || "" : "");
    const [newClientName, setNewClientName] = useState("");
    const [clientId, setClientId] = useState<string | null>(sale?.clientId || null);
    const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);
    const [cart, setCart] = useState<CartItem[]>(
        sale?.items.map((item) => ({
            ...item,
            id: generateId(),
            availableStock: getProductById(item.productId)?.stock || 0,
        })) || []
    );
    const [paymentStatus, setPaymentStatus] = useState<"full" | "partial" | "debt">(
        sale?.paymentStatus || "full"
    );
    const [amountPaid, setAmountPaid] = useState(sale?.paidAmount.toString() || "");
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState("");
    const [selectedPrice, setSelectedPrice] = useState("");
    const [error, setError] = useState("");
    // Nouvel état pour la date
    const [selectedDate, setSelectedDate] = useState<Date>(
        sale?.date ? new Date(sale.date) : new Date()
    );
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Client suggestions
    useEffect(() => {
        if (clientName.trim()) {
            const filtered = clients
                .filter((client) =>
                    client.name.toLowerCase().includes(clientName.toLowerCase())
                )
                .slice(0, 5);
            setClientSuggestions(filtered);
            setShowClientSuggestions(filtered.length > 0);
        } else {
            setClientSuggestions([]);
            setShowClientSuggestions(false);
            setClientId(null);
        }
    }, [clientName, clients]);

    // Calculate total
    const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const remainingDebt =
        paymentStatus === "partial"
            ? Math.max(0, totalAmount - (parseFloat(amountPaid) || 0))
            : paymentStatus === "debt"
                ? totalAmount
                : 0;

    const handleAddProductToCart = () => {
        setError("");

        if (!selectedProduct || !selectedQuantity || !selectedPrice) {
            setError("Please complete all fields");
            return;
        }

        const product = getProductById(selectedProduct);
        const quantity = parseFloat(selectedQuantity);
        const price = parseFloat(selectedPrice);

        if (!product) {
            setError("Product not found");
            return;
        }

        if (quantity <= 0) {
            setError("Quantity must be greater than 0");
            return;
        }

        if (quantity > product.stock) {
            setError(`Insufficient stock. Available: ${product.stock}`);
            return;
        }

        const existingItemIndex = cart.findIndex(
            (item) => item.productId === selectedProduct
        );

        if (existingItemIndex >= 0) {
            const newQuantity = cart[existingItemIndex].quantity + quantity;
            if (newQuantity > product.stock) {
                setError(
                    `Insufficient stock. Available: ${product.stock}, In cart: ${cart[existingItemIndex].quantity}`
                );
                return;
            }

            const updatedCart = [...cart];
            updatedCart[existingItemIndex] = {
                ...updatedCart[existingItemIndex],
                quantity: newQuantity,
                totalPrice: newQuantity * price,
            };
            setCart(updatedCart);
        } else {
            const newItem: CartItem = {
                id: generateId(),
                productId: selectedProduct,
                quantity,
                unitPrice: price,
                totalPrice: quantity * price,
                // Ajoute ces champs si tu veux tracker la sync avec Product
                lastSyncTimestamp: undefined,
                isDeleted: false,
                availableStock: product.stock,
                version: 1,
            };
            setCart([...cart, newItem]);
        }

        // Reset des champs
        setSelectedProduct("");
        setSelectedQuantity("");
        setSelectedPrice("");
        setShowAddProductModal(false);
    };

    const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        setCart((prevCart) =>
            prevCart.map((item) => {
                if (item.id === itemId) {
                    const product = getProductById(item.productId);
                    if (product && newQuantity > product.stock) {
                        setError(`Cannot exceed available stock: ${product.stock}`);
                        return item;
                    }
                    return {
                        ...item,
                        quantity: newQuantity,
                        totalPrice: newQuantity * item.unitPrice,
                    };
                }
                return item;
            })
        );
    };

    const removeFromCart = (itemId: string) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
    };

    const handleProductSelect = (productId: string) => {
        const product = getProductById(productId);
        if (product) {
            setSelectedProduct(productId);
            setSelectedPrice(product.salePrice.toFixed(2));
        }
    };

    const handleClientSelect = (client: Client) => {
        setClientName(client.name);
        setClientId(client.id);
        setShowClientSuggestions(false);
    };

    // Gestion de la date
    const handleDateChange = (event: any, newDate?: Date) => {
        setShowDatePicker(Platform.OS === "ios"); // Garde le picker ouvert sur iOS
        if (newDate) {
            setSelectedDate(newDate);
        }
    };

    const handleSave = () => {
        setError("");

        if (!clientName.trim() && !clientId) {
            setError("Client name is required");
            return;
        }
        if (cart.length === 0) {
            setError("Please add at least one product to the cart");
            return;
        }
        if (paymentStatus === "partial") {
            const paid = parseFloat(amountPaid) || 0;
            if (paid <= 0 || paid >= totalAmount) {
                setError("Amount paid must be > 0 and < total amount");
                return;
            }
        }

        const saleData: Sale = {
            id: saleId || generateId(),
            clientId,
            items: cart.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                version: item.version || 1,
                isDeleted: item.isDeleted || false,
                syncStatus: item.syncStatus || 'pending',
                lastSyncTimestamp: item.lastSyncTimestamp,
            })),
            totalAmount,
            paidAmount:
                paymentStatus === "partial"
                    ? parseFloat(amountPaid) || 0
                    : paymentStatus === "full"
                        ? totalAmount
                        : 0,
            debtAmount: remainingDebt,
            paymentStatus,
            date: selectedDate.toISOString(),
            version: 1,
            isDeleted: false,
            syncStatus: 'pending',
            lastSyncTimestamp: undefined,
        };


        if (saleId) {
            const existingSale = sales.find((s) => s.id === saleId);
            if (!existingSale) {
                setError("Sale not found");
                return;
            }

            setProducts((prev) =>
                prev.map((p) => {
                    const oldItem = existingSale.items.find((i) => i.productId === p.id);
                    const newItem = saleData.items.find((i) => i.productId === p.id);
                    let stock = p.stock;
                    if (oldItem) stock += oldItem.quantity;
                    if (newItem) stock -= newItem.quantity;
                    return oldItem || newItem ? { ...p, stock } : p;
                })
            );

            setClients((prev) =>
                prev.map((c) => {
                    if (c.id === existingSale.clientId) {
                        return {
                            ...c,
                            totalSpent: c.totalSpent - existingSale.totalAmount,
                            debtAmount: c.debtAmount - existingSale.debtAmount,
                            purchaseCount: existingSale.clientId !== saleData.clientId
                                ? Math.max(0, c.purchaseCount - 1)
                                : c.purchaseCount,
                        };
                    }
                    if (c.id === saleData.clientId) {
                        return {
                            ...c,
                            totalSpent: c.totalSpent + saleData.totalAmount,
                            debtAmount: c.debtAmount + saleData.debtAmount,
                            purchaseCount: existingSale.clientId !== saleData.clientId
                                ? c.purchaseCount + 1
                                : c.purchaseCount,
                        };
                    }
                    return c;
                })
            );

            setSales((prev) => prev.map((s) => (s.id === saleId ? saleData : s)));

            if (saleData.debtAmount > 0 && saleData.clientId) {
                const existingDebt = debts.find((d) => d.saleId === saleId);
                if (existingDebt) {
                    updateDabt({
                        ...existingDebt,
                        version: (existingDebt.version ?? 1) + 1, // incrémente la version
                        isDeleted: existingDebt.isDeleted ?? false,
                        syncStatus: 'pending',
                        lastSyncTimestamp: undefined,
                        saleId: saleData.id,
                        clientId: saleData.clientId,
                        amount: saleData.debtAmount,
                        createdAt: saleData.date,
                    });
                } else {
                    addDebt({
                        version: 1, // nouvelle dette commence à 1
                        isDeleted: false,
                        syncStatus: 'pending',
                        lastSyncTimestamp: undefined,
                        id: generateId(),
                        saleId: saleData.id,
                        clientId: saleData.clientId,
                        amount: saleData.debtAmount,
                        createdAt: new Date().toISOString(),
                        paymentHistory: [],
                    });
                }
            }


            if(saleData.paymentStatus ==="full"){
                const existingdebt = debts.find((d) => d.saleId === saleId)
                if(existingdebt){
                    deleteDebt(existingdebt.id)
                }
            }

            Alert.alert("Success", "Sale updated successfully!");
        } else {
            setProducts((prev) =>
                prev.map((p) => {
                    const sold = saleData.items.find((i) => i.productId === p.id);
                    return sold ? { ...p, stock: p.stock - sold.quantity } : p;
                })
            );

            if (saleData.clientId) {
                setClients((prev) =>
                    prev.map((c) =>
                        c.id === saleData.clientId
                            ? {
                                ...c,
                                purchaseCount: c.purchaseCount + 1,
                                totalSpent: c.totalSpent + saleData.totalAmount,
                                debtAmount: c.debtAmount + saleData.debtAmount,
                            }
                            : c
                    )
                );
            }

            if (saleData.debtAmount > 0 && saleData.clientId) {
                addDebt({
                    version: 1,
                    isDeleted: false,
                    syncStatus: 'pending',
                    lastSyncTimestamp: undefined,
                    id: generateId(),
                    saleId: saleData.id,
                    clientId: saleData.clientId,
                    amount: saleData.debtAmount,
                    createdAt: new Date().toISOString(),
                    paymentHistory: [],
                });
            }


            addSale(saleData);
            Alert.alert("Success", "Sale created successfully!");
        }

        navigation.goBack();
    };

    const handleAddNewClient = () => {
        if (!newClientName.trim()) {
            setError("New client name is required");
            return;
        }

        const newClient: Client = {
            version: 1,
            isDeleted: false,
            syncStatus: 'pending',
            lastSyncTimestamp: undefined,
            id: generateId(),
            name: newClientName.trim(),
            purchaseCount: 0,
            totalSpent: 0,
            debtAmount: 0,
            createdAt: new Date().toISOString(),
        };


        addClient(newClient);
        setClientId(newClient.id);
        setClientName(newClient.name);
        setNewClientName("");
        Alert.alert("Success", "New client added successfully!");
    };

    // Formatage de la date pour l'affichage
    const formatDate = (date: Date) => {
        return date.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <Header
                title={saleId ? "Edit Sale" : "New Sale"}
                right={
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        activeOpacity={0.6}
                    >
                        <Ionicons name="checkmark" size={24} color="#007AFF" />
                    </TouchableOpacity>
                }
            />
            <ScrollView contentContainerStyle={styles.content}>
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Client Selection */}
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Client Name *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={clientId || "walk-in"}
                            onValueChange={(value) => {
                                if (value === "walk-in") {
                                    setClientId(null);
                                    setClientName("");
                                } else {
                                    const client = clients.find((c) => c.id === value);
                                    if (client) {
                                        setClientId(value);
                                        setClientName(client.name);
                                    }
                                }
                                setShowClientSuggestions(false);
                                setNewClientName("");
                            }}
                            style={styles.picker}
                        >
                            <Picker.Item label="Walk-in Customer" value="walk-in" style={styles.input} />
                            {clients.map((client) => (
                                <Picker.Item
                                    key={client.id}
                                    label={client.name}
                                    value={client.id}
                                    style={styles.input}
                                />
                            ))}
                        </Picker>
                    </View>
                    {clientId === null && (
                        <>
                            <TextInput
                                style={styles.input}
                                value={newClientName}
                                onChangeText={setNewClientName}
                                placeholder="Enter new client name"
                                onBlur={() => {
                                    if (newClientName.trim()) {
                                        Alert.alert(
                                            "New Client",
                                            `Are you sure you want to create a new client named "${newClientName}"?`,
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                {
                                                    text: "Yes",
                                                    style: "default",
                                                    onPress: handleAddNewClient,
                                                },
                                            ]
                                        );
                                    }
                                }}
                            />
                        </>
                    )}
                </View>

                {/* Date Selection */}
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Purchase Date *</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display={Platform.OS === "ios" ? "inline" : "default"}
                            onChange={handleDateChange}
                            maximumDate={new Date()} // Empêche de sélectionner une date future
                        />
                    )}
                </View>

                {/* Shopping Cart */}
                <View style={styles.formCard}>
                    <View style={styles.cartHeader}>
                        <Text style={styles.sectionTitle}>Shopping Cart ({cart.length} items)</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setShowAddProductModal(true)}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.addButtonText}>+ Add Product</Text>
                        </TouchableOpacity>
                    </View>

                    {cart.length === 0 ? (
                        <View style={styles.emptyCart}>
                            <Ionicons name="cart-outline" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyCartText}>Cart is empty</Text>
                            <Text style={styles.emptyCartSubText}>
                                Add products to start creating a sale
                            </Text>
                        </View>
                    ) : (
                        cart.map((item) => (
                            <View key={item.id} style={styles.cartItem}>
                                <View style={styles.cartItemHeader}>
                                    <Text style={styles.cartItemName}>
                                        {getProductById(item.productId)?.name || "Unknown Product"}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => removeFromCart(item.id)}
                                        activeOpacity={0.6}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.cartItemDetails}>
                                    <View style={styles.quantityControls}>
                                        <TouchableOpacity
                                            style={styles.quantityButton}
                                            onPress={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            <Ionicons name="remove" size={16} color="#007AFF" />
                                        </TouchableOpacity>
                                        <Text style={styles.quantityText}>{item.quantity}</Text>
                                        <TouchableOpacity
                                            style={styles.quantityButton}
                                            onPress={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                            disabled={item.quantity >= item.availableStock}
                                        >
                                            <Ionicons name="add" size={16} color="#007AFF" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.priceDetails}>
                                        <Text style={styles.priceText}>
                                            {config?.currencySymbol || "$"}
                                            {item.unitPrice.toFixed(2)} × {item.quantity}
                                        </Text>
                                        <Text style={styles.totalPrice}>
                                            {config?.currencySymbol || "$"}
                                            {item.totalPrice.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.stockText}>
                                    Available stock: {item.availableStock}
                                </Text>
                            </View>
                        ))
                    )}

                    {cart.length > 0 && (
                        <View style={styles.cartTotal}>
                            <Text style={styles.totalLabel}>Total:</Text>
                            <Text style={styles.totalValue}>
                                {config?.currencySymbol || "$"}
                                {totalAmount.toFixed(2)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Payment Details */}
                {cart.length > 0 && (
                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Payment Status</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={paymentStatus}
                                onValueChange={(value: "full" | "partial" | "debt") =>
                                    setPaymentStatus(value)
                                }
                                style={styles.picker}
                            >
                                <Picker.Item label="Paid in Full" value="full" style={styles.input} />
                                <Picker.Item label="Partial Payment" value="partial" style={styles.input} />
                                <Picker.Item label="Unpaid (Debt)" value="debt" style={styles.input} />
                            </Picker>
                        </View>

                        {paymentStatus === "partial" && (
                            <View style={styles.paymentDetails}>
                                <Text style={styles.sectionTitle}>Amount Paid *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={amountPaid}
                                    onChangeText={setAmountPaid}
                                    keyboardType="numeric"
                                    placeholder="Enter amount paid"
                                />
                                <View style={styles.paymentRow}>
                                    <Text style={styles.paymentLabel}>Remaining Debt:</Text>
                                    <Text style={[styles.paymentValue, { color: "#FF9500" }]}>
                                        {config?.currencySymbol || "$"}
                                        {remainingDebt.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Add Product Modal */}
            {/* Add Product Modal */}
            <Modal
                visible={showAddProductModal}
                animationType="slide"
                onRequestClose={() => setShowAddProductModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Product to Cart</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowAddProductModal(false)}
                            activeOpacity={0.6}
                        >
                            <Ionicons name="close" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.sectionTitle}>Product Name *</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedProduct}
                                onValueChange={handleProductSelect}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a product" value="" style={styles.input} />
                                {products
                                    .filter((product) => product.stock > 0)
                                    .map((product) => (
                                        <Picker.Item
                                            key={product.id}
                                            label={`${product.name} (Stock: ${product.stock})`}
                                            value={product.id}
                                            style={styles.input}
                                        />
                                    ))}
                            </Picker>
                        </View>

                        {selectedProduct && (
                            <>
                                <Text style={styles.sectionTitle}>Quantity *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={selectedQuantity}
                                    onChangeText={setSelectedQuantity}
                                    keyboardType="numeric"
                                    placeholder="Enter quantity"
                                />
                                <Text style={styles.noteText}>
                                    Available: {getProductById(selectedProduct)?.stock || 0}
                                </Text>

                                <Text style={styles.sectionTitle}>Unit Price *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={selectedPrice}
                                    onChangeText={setSelectedPrice}
                                    keyboardType="numeric"
                                    placeholder="Enter unit price"
                                />

                                {selectedQuantity && selectedPrice && (
                                    <View style={styles.totalPreview}>
                                        <Text style={styles.totalPreviewLabel}>Total:</Text>
                                        <Text style={styles.totalPreviewValue}>
                                            {config?.currencySymbol || "$"}
                                            {(parseFloat(selectedQuantity) * parseFloat(selectedPrice)).toFixed(2)}
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}

                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleAddProductToCart}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.modalButtonText}>Add to Cart</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowAddProductModal(false)}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2F2F7",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: "700",
        color: "#000000",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    saveButton: {
        width: 40,
        height: 40,
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: "600",
        color: "#000000",
        marginBottom: 12,
        marginTop: 8,
    },
    input: {
        backgroundColor: "#F7F7F7",
        borderRadius: 8,
        padding: 12,
        fontSize: 10,
        color: "#000000",
        marginBottom: 12,
    },
    pickerContainer: {
        backgroundColor: "#F7F7F7",
        borderRadius: 8,
        marginBottom: 12,
    },
    picker: {
        height: 50,
    },
    suggestionsContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        maxHeight: 200,
        overflow: "hidden",
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F2F2F7",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    suggestionText: {
        fontSize: 15,
        color: "#000000",
    },
    suggestionSubText: {
        fontSize: 10,
        color: "#8E8E93",
    },
    cartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    addButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#34C759",
        borderRadius: 8,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "500",
    },
    emptyCart: {
        alignItems: "center",
        paddingVertical: 32,
    },
    emptyCartText: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 8,
    },
    emptyCartSubText: {
        fontSize: 10,
        color: "#8E8E93",
    },
    cartItem: {
        backgroundColor: "#F7F7F7",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    cartItemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    cartItemName: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
    },
    removeButton: {
        width: 30,
        height: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    cartItemDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    quantityButton: {
        width: 30,
        height: 30,
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    quantityText: {
        fontSize: 10,
        color: "#000000",
        width: 40,
        textAlign: "center",
    },
    priceDetails: {
        alignItems: "flex-end",
    },
    priceText: {
        fontSize: 12,
        color: "#8E8E93",
    },
    totalPrice: {
        fontSize: 10,
        fontWeight: "500",
        color: "#000000",
    },
    stockText: {
        fontSize: 9,
        color: "#8E8E93",
        marginTop: 4,
    },
    cartTotal: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F2F2F7",
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#000000",
    },
    totalValue: {
        fontSize: 13,
        fontWeight: "600",
        color: "#000000",
    },
    paymentDetails: {
        backgroundColor: "#FFF7E6",
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
    },
    paymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    paymentLabel: {
        fontSize: 10,
        color: "#8E8E93",
    },
    paymentValue: {
        fontSize: 11,
        fontWeight: "500",
        color: "#000000",
    },
    errorContainer: {
        backgroundColor: "#FEF2F2",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    errorText: {
        color: "#DC2626",
        fontSize: 11,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#F2F2F7",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#000000",
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    modalContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    modalButtons: {
        flexDirection: "row",
        gap: 12,
        marginTop: 16,
    },
    modalButton: {
        flex: 1,
        backgroundColor: "#34C759",
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
    },
    cancelButton: {
        backgroundColor: "#E5E7EB",
    },
    modalButtonText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "500",
    },
    noteText: {
        paddingBlock: 1,
        fontSize: 10,
        color: "#8E8E93",
    },
    totalPreview: {
        backgroundColor: "#ECFDF5",
        borderRadius: 8,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    totalPreviewLabel: {
        fontSize: 12,
        color: "#000000",
    },
    totalPreviewValue: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
    },
    dateText: {
        fontSize: 10,
        color: "#000000",
    },
});