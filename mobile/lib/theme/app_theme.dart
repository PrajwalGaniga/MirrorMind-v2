import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Editorial Warm Ivory Color Palette (Aligned with MirrorMind v2 Web & UI Reference)
  static const Color pageBackdrop = Color(0xFFAEB5C0);
  static const Color shellBase = Color(0xFFF2F1E8);      // Main warm ivory canvas
  static const Color surface = Color(0xFFFAFAF7);        // Primary cards and panels
  static const Color surfaceCard = Color(0xFFFFFFFF);    // Crisp white card surface
  static const Color surfaceSoft = Color(0xFFF0F0EC);    // Secondary neutral surfaces
  static const Color surfaceMuted = Color(0xFFE5E6E3);   // Inactive tracks, dividers
  static const Color borderSubtle = Color(0xFFD8D9D3);   // Hairline card borders

  static const Color textPrimary = Color(0xFF171817);    // Deep charcoal typography
  static const Color textSecondary = Color(0xFF5F605C);  // Supporting labels
  static const Color textMuted = Color(0xFF898A84);      // Tertiary / timestamps

  static const Color accent = Color(0xFFF7D45B);         // Warm golden yellow accent
  static const Color accentSoft = Color(0xFFFBE9A1);     // Pale accent highlight
  static const Color charcoal = Color(0xFF292A29);       // High-contrast primary anchors

  // Status & Functional Colors
  static const Color accentBlue = Color(0xFF0284C7);     // Deep Sky Blue (Vector & System tags)
  static const Color accentEmerald = Color(0xFF059669);  // Grounded verification & success
  static const Color accentRed = Color(0xFFDC2626);      // Errors & alerts
  static const Color accentPurple = Color(0xFF7C3AED);   // Neural activations

  // Legacy aliases for backward compatibility across existing widgets
  static const Color bgDark = shellBase;
  static const Color bgCard = surfaceCard;
  static const Color bgCardHover = surfaceSoft;
  static const Color borderColor = borderSubtle;
  static const Color borderHover = borderSubtle;
  static const Color accentCyan = accentBlue;
  static const Color accentIndigo = charcoal;
  static const Color accentAmber = accent;
  static const Color textMain = textPrimary;
  static const Color textSubtle = textMuted;

  // Editorial Gradients
  static const LinearGradient shellGradient = LinearGradient(
    colors: [Color(0xFFF5F4EC), Color(0xFFEFEFE5)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Colors.white, Color(0xFFFAFAF8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [accent, Color(0xFFE5C040)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient charcoalGradient = LinearGradient(
    colors: [charcoal, Color(0xFF1C1D1C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient glowGradient = charcoalGradient;
  static const LinearGradient cyanGradient = LinearGradient(
    colors: [accentBlue, Color(0xFF0369A1)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  static const LinearGradient emeraldGradient = LinearGradient(
    colors: [accentEmerald, Color(0xFF047857)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: shellBase,
      primaryColor: charcoal,
      canvasColor: shellBase,
      colorScheme: const ColorScheme.light(
        primary: charcoal,
        secondary: accent,
        surface: surfaceCard,
        error: accentRed,
        onPrimary: Colors.white,
        onSecondary: charcoal,
        onSurface: textPrimary,
      ),
      textTheme: GoogleFonts.plusJakartaSansTextTheme().apply(
        bodyColor: textPrimary,
        displayColor: textPrimary,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: textPrimary, size: 20),
        titleTextStyle: TextStyle(
          color: textPrimary,
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: surfaceCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: borderSubtle, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceCard,
        hintStyle: const TextStyle(color: textMuted, fontSize: 13),
        labelStyle: const TextStyle(color: textSecondary, fontSize: 13, fontWeight: FontWeight.w500),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: charcoal, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: charcoal,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13.5,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textPrimary,
          side: const BorderSide(color: borderSubtle),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  // Dark theme alias forwards to warm editorial theme for unified aesthetic
  static ThemeData get darkTheme => lightTheme;
}
