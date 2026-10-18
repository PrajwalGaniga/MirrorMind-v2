import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SkillRadarChart extends StatelessWidget {
  final Map<String, int> scores;
  final double size;

  const SkillRadarChart({
    super.key,
    required this.scores,
    this.size = 230,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: size,
          height: size,
          child: CustomPaint(
            painter: _RadarPainter(scores: scores),
          ),
        ),
        const SizedBox(height: 18),
        // Metric Score Bars below
        ...scores.entries.map((entry) {
          final score = entry.value;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      entry.key,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    Text(
                      '$score / 100',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.charcoal,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: (score / 100).clamp(0.0, 1.0),
                    minHeight: 6,
                    backgroundColor: AppTheme.surfaceMuted,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accent),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}

class _RadarPainter extends CustomPainter {
  final Map<String, int> scores;

  _RadarPainter({required this.scores});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - 28;
    final keys = scores.keys.toList();
    final count = keys.isEmpty ? 5 : keys.length;

    final gridPaint = Paint()
      ..color = AppTheme.borderSubtle
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final axisPaint = Paint()
      ..color = AppTheme.borderSubtle
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    // 1. Draw Concentric Grid Polygons (20%, 40%, 60%, 80%, 100%)
    for (int step = 1; step <= 5; step++) {
      final r = radius * (step / 5);
      final path = Path();
      for (int i = 0; i < count; i++) {
        final angle = (math.pi * 2 / count) * i - math.pi / 2;
        final x = center.dx + r * math.cos(angle);
        final y = center.dy + r * math.sin(angle);
        if (i == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
      path.close();
      canvas.drawPath(path, gridPaint);
    }

    // 2. Draw Radial Axis Lines & Labels
    for (int i = 0; i < count; i++) {
      final angle = (math.pi * 2 / count) * i - math.pi / 2;
      final x = center.dx + radius * math.cos(angle);
      final y = center.dy + radius * math.sin(angle);
      canvas.drawLine(center, Offset(x, y), axisPaint);

      // Label
      if (i < keys.length) {
        final label = keys[i];
        final labelX = center.dx + (radius + 16) * math.cos(angle);
        final labelY = center.dy + (radius + 16) * math.sin(angle);

        final textSpan = TextSpan(
          text: _shortLabel(label),
          style: const TextStyle(
            color: AppTheme.textSecondary,
            fontSize: 9.5,
            fontWeight: FontWeight.w600,
          ),
        );
        final textPainter = TextPainter(
          text: textSpan,
          textDirection: TextDirection.ltr,
          textAlign: TextAlign.center,
        )..layout();

        textPainter.paint(
          canvas,
          Offset(labelX - textPainter.width / 2, labelY - textPainter.height / 2),
        );
      }
    }

    // 3. Draw Filled Score Polygon
    if (scores.isNotEmpty) {
      final polyPath = Path();
      final points = <Offset>[];

      for (int i = 0; i < count; i++) {
        final key = keys[i];
        final val = (scores[key] ?? 50).clamp(0, 100);
        final r = radius * (val / 100);
        final angle = (math.pi * 2 / count) * i - math.pi / 2;
        final point = Offset(center.dx + r * math.cos(angle), center.dy + r * math.sin(angle));
        points.add(point);

        if (i == 0) {
          polyPath.moveTo(point.dx, point.dy);
        } else {
          polyPath.lineTo(point.dx, point.dy);
        }
      }
      polyPath.close();

      // Soft warm yellow fill
      final fillPaint = Paint()
        ..color = const Color(0x40F7D45B)
        ..style = PaintingStyle.fill;

      canvas.drawPath(polyPath, fillPaint);

      // Charcoal / amber border
      final borderPaint = Paint()
        ..color = AppTheme.charcoal
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0;

      canvas.drawPath(polyPath, borderPaint);

      // 4. Draw Vertex Dots
      final dotPaint = Paint()..color = AppTheme.accent;
      final dotBorderPaint = Paint()
        ..color = AppTheme.charcoal
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5;

      for (final p in points) {
        canvas.drawCircle(p, 4.0, dotPaint);
        canvas.drawCircle(p, 4.0, dotBorderPaint);
      }
    }
  }

  String _shortLabel(String name) {
    if (name.contains('Core Systems')) return 'Systems';
    if (name.contains('Distributed')) return 'Distributed';
    if (name.contains('Data & ML')) return 'Data/ML';
    if (name.contains('Cloud')) return 'Cloud';
    if (name.contains('Product')) return 'Velocity';
    if (name.contains('Framework')) return 'Framework';
    return name;
  }

  @override
  bool shouldRepaint(covariant _RadarPainter oldDelegate) => true;
}
