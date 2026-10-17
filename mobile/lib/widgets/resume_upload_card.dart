import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../services/api_service.dart';
import '../models/resume_parse_result.dart';
import '../theme/app_theme.dart';
import 'glass_card.dart';

class ResumeUploadCard extends StatefulWidget {
  final Function(ExtractedResumeData data, String url, String filename) onExtracted;

  const ResumeUploadCard({super.key, required this.onExtracted});

  @override
  State<ResumeUploadCard> createState() => _ResumeUploadCardState();
}

class _ResumeUploadCardState extends State<ResumeUploadCard> {
  bool _isUploading = false;
  String _uploadStep = '';
  String? _errorMessage;
  String? _successFilename;

  Future<void> _pickAndUploadResume() async {
    setState(() {
      _errorMessage = null;
    });

    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'docx', 'txt'],
        withData: true,
      );

      if (result == null || result.files.isEmpty) return;

      final file = result.files.first;
      if (file.bytes == null) {
        setState(() {
          _errorMessage = 'Could not read file data';
        });
        return;
      }

      setState(() {
        _isUploading = true;
        _uploadStep = 'Uploading to Cloudinary storage...';
      });

      // Simulation steps for user reassurance
      Future.delayed(const Duration(milliseconds: 1600), () {
        if (mounted && _isUploading) {
          setState(() {
            _uploadStep = 'Gemini 3.8 Flash parsing structured profile...';
          });
        }
      });

      final parseResult = await ApiService().uploadResume(file.bytes!, file.name);

      if (mounted) {
        setState(() {
          _isUploading = false;
          _uploadStep = '';
          _successFilename = file.name;
        });

        widget.onExtracted(
          parseResult.extractedData,
          parseResult.cloudinaryUrl,
          file.name,
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isUploading = false;
          _uploadStep = '';
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderColor: AppTheme.accentIndigo.withOpacity(0.35),
      padding: const EdgeInsets.all(20),
      onTap: _isUploading ? null : _pickAndUploadResume,
      child: Column(
        children: [
          if (_isUploading) ...[
            const SizedBox(height: 10),
            const SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation<Color>(AppTheme.accentCyan),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'AI Resume Extraction in Progress',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const SizedBox(height: 6),
            Text(
              _uploadStep,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: AppTheme.accentCyan),
            ),
            const SizedBox(height: 10),
          ] else ...[
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.accentIndigo.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.accentIndigo.withOpacity(0.3)),
                  ),
                  child: const Center(
                    child: Text('📄', style: TextStyle(fontSize: 22)),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Fast-Track: Upload Resume',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Tap to upload PDF/DOCX • Auto-fills form',
                        style: TextStyle(color: AppTheme.textMuted.withOpacity(0.9), fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.upload_file, color: AppTheme.accentCyan, size: 22),
              ],
            ),
          ],
          if (_successFilename != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.accentEmerald.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.accentEmerald.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: AppTheme.accentEmerald, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Successfully extracted from $_successFilename!',
                      style: const TextStyle(fontSize: 11.5, color: Color(0xFF6EE7B7)),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (_errorMessage != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.accentRed.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.accentRed.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppTheme.accentRed, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(fontSize: 11.5, color: Color(0xFFFCA5A5)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
