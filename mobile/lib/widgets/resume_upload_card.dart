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
      borderColor: AppTheme.borderSubtle,
      padding: const EdgeInsets.all(18),
      onTap: _isUploading ? null : _pickAndUploadResume,
      child: Column(
        children: [
          if (_isUploading) ...[
            const SizedBox(height: 8),
            const SizedBox(
              width: 30,
              height: 30,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation<Color>(AppTheme.charcoal),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'AI Resume Ingestion & Parsing...',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 4),
            Text(
              _uploadStep,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 8),
          ] else ...[
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceSoft,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderSubtle),
                  ),
                  child: const Center(
                    child: Icon(Icons.description_outlined, color: AppTheme.charcoal, size: 22),
                  ),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Upload Resume Document',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: AppTheme.textPrimary),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'PDF / DOCX • Extracts skills & projects into vault',
                        style: TextStyle(color: AppTheme.textSecondary, fontSize: 11.5),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.charcoal,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.file_upload_outlined, color: Colors.white, size: 18),
                ),
              ],
            ),
          ],
          if (_successFilename != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: AppTheme.accentEmerald, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Successfully ingested & indexed $_successFilename!',
                      style: const TextStyle(fontSize: 11.5, color: Color(0xFF065F46), fontWeight: FontWeight.w600),
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
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppTheme.accentRed, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(fontSize: 11.5, color: Color(0xFF991B1B)),
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
