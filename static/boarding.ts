export interface OnboardingScreen {
    title: string;
    description: string;
    image: string; // URL or local path to image
}

export const onboardingScreens: OnboardingScreen[] = [
    {
        title: "Bienvenue sur Biz-Mob",
        description: "Gérez votre petite entreprise facilement depuis votre mobile.",
        image: "/assets/boarding/onboarding1.png"
    },
    {
        title: "Suivi des ventes",
        description: "Visualisez vos ventes et vos statistiques en temps réel.",
        image: "/assets/boarding/onboarding2.png"
    },
    {
        title: "Gestion des clients",
        description: "Ajoutez et gérez vos clients en quelques clics.",
        image: "/assets/boarding/onboarding3.png"
    }
];