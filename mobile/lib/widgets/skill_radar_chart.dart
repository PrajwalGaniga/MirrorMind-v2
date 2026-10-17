import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SkillRadarChart extends StatelessWidget {
  final Map<String, int> scores;
  final double size;

  const SkillRadarChart({
    super.key,
    required this.scores,
    this.size = 240,
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
        const SizedBox(height: 16),
        // Metric Score Bars below
        ...scores.entries.map((entry) {
          final score = entry.value;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      entry.key,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    Text(
                      '$score / 100',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.accentCyan,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: score / 100,
                    minHeight: 6,
                    backgroundColor: Colors.white.withOpacity(0.06),
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accentCyan),
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
    final radius = (size.width / 2) - 30;
    final keys = scores.keys.toList();
    final count = keys.isEmpty ? 5 : keys.length;

    final gridPaint = Paint()
      ..color = Colors.white.withOpacity(0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final axisPaint = Paint()
      ..color = Colors.white.withOpacity(0.12)
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
        final labelX = center.dx + (radius + 18) * math.cos(angle);
        final labelY = center.dy + (radius + 18) * math.sin(angle);

        final textSpan = TextSpan(
          text: _shortLabel(label),
          style: TextStyle(
            color: AppTheme.textMuted.withOpacity(0.85),
            fontSize: 9,
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

      final fillPaint = Paint()
        ..shader = const RadialGradient(
          colors: [
            Color(0x6606B6D4),
            Color(0x226366F1),
          ],
        ).createShader(Rect.fromCircle(center: center, radius: radius))
        ..style = PaintingStyle.fill;

      canvas.drawPath(polyPath, fillPaint);

      final borderPaint = Paint()
        ..color = AppTheme.accentCyan
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0;

      canvas.drawPath(polyPath, borderPaint);

      // 4. Draw Vertex Dots
      final dotPaint = Paint()..color = AppTheme.accentPurple;
      final dotBorderPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5;

      for (final p in points) {
        canvas.drawCircle(p, 4.0, dotPaint);
        canvas.drawCircle(p, 4.0, dotBorderPaint);
      }
    }
  }

  String _shortLabel(String name) {
    if (name.contains('Core')) return 'Core';
    if (name.contains('Framework')) return 'Framework';
    if (name.contains('System')) return 'Cloud';
    if (name.contains('Data')) return 'Data';
    if (name.contains('Practices')) return 'DevOps';
    return name;
  }

  @override
  bool shouldRepaint(covariant _RadarPainter oldDelegate) => true;
}
