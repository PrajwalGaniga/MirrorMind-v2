import 'package:flutter/material.dart';
import '../models/student_profile.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class AcademicEditDialog extends StatefulWidget {
  final StudentProfile student;
  final VoidCallback onSuccess;

  const AcademicEditDialog({
    super.key,
    required this.student,
    required this.onSuccess,
  });

  @override
  State<AcademicEditDialog> createState() => _AcademicEditDialogState();
}

class _AcademicEditDialogState extends State<AcademicEditDialog> {
  late TextEditingController _collegeController;
  late TextEditingController _cgpaController;
  late TextEditingController _branchController;
  late TextEditingController _semesterController;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _collegeController = TextEditingController(text: widget.student.collegeName ?? 'Visvesvaraya Technological University (SIT)');
    _cgpaController = TextEditingController(text: widget.student.cgpa.toString());
    _branchController = TextEditingController(text: widget.student.branch);
    _semesterController = TextEditingController(text: widget.student.semester.toString());
  }

  @override
  void dispose() {
    _collegeController.dispose();
    _cgpaController.dispose();
    _branchController.dispose();
    _semesterController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    final cgpaVal = double.tryParse(_cgpaController.text.trim());
    if (cgpaVal == null || cgpaVal < 0 || cgpaVal > 10.0) {
      setState(() => _error = 'Please enter a valid CGPA between 0.0 and 10.0');
      return;
    }

    final collegeVal = _collegeController.text.trim();
    if (collegeVal.isEmpty) {
      setState(() => _error = 'College / University name cannot be empty');
      return;
    }

    final semVal = int.tryParse(_semesterController.text.trim()) ?? 6;

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await ApiService().updateAcademics(
        email: widget.student.email,
        cgpa: cgpaVal,
        collegeName: collegeVal,
        branch: _branchController.text.trim(),
        semester: semVal,
      );

      if (mounted) {
        Navigator.pop(context);
        widget.onSuccess();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('⚡ Academic credentials updated in MongoDB!'),
            backgroundColor: AppTheme.accentEmerald,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _saving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppTheme.surfaceCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppTheme.borderSubtle),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Update Academic Profile',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppTheme.textPrimary),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _collegeController,
                decoration: const InputDecoration(
                  labelText: 'College / University Name',
                  prefixIcon: Icon(Icons.account_balance, size: 18),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _cgpaController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'CGPA (e.g. 9.25)',
                        prefixIcon: Icon(Icons.grade, size: 18),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _semesterController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Semester (1-8)',
                        prefixIcon: Icon(Icons.calendar_today, size: 18),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _branchController,
                decoration: const InputDecoration(
                  labelText: 'Degree / Branch of Engineering',
                  prefixIcon: Icon(Icons.code, size: 18),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 10),
                Text(_error!, style: const TextStyle(color: AppTheme.accentRed, fontSize: 11)),
              ],
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _handleSave,
                child: _saving
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Save Academic Credentials'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
