import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pet_hub/providers/providers.dart';
import 'package:pet_hub/models/pet.dart';

class PetProfileScreen extends ConsumerStatefulWidget {
  final int petId;

  const PetProfileScreen({super.key, required this.petId});

  @override
  ConsumerState<PetProfileScreen> createState() => _PetProfileScreenState();
}

class _PetProfileScreenState extends ConsumerState<PetProfileScreen> {
  final _vaccineNameController = TextEditingController();
  final _dateGivenController = TextEditingController();
  final _nextDueController = TextEditingController();

  @override
  void dispose() {
    _vaccineNameController.dispose();
    _dateGivenController.dispose();
    _nextDueController.dispose();
    super.dispose();
  }

  Future<void> _addVaccination() async {
    if (_vaccineNameController.text.isEmpty ||
        _dateGivenController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill required fields')),
      );
      return;
    }

    try {
      await ref.read(apiServiceProvider).addVaccination(widget.petId, {
        'vaccineName': _vaccineNameController.text,
        'dateGiven': _dateGivenController.text,
        'nextDue': _nextDueController.text.isNotEmpty
            ? _nextDueController.text
            : null,
      });

      ref.invalidate(petsProvider);
      _vaccineNameController.clear();
      _dateGivenController.clear();
      _nextDueController.clear();

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Vaccination added!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final petsAsync = ref.watch(petsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pet Profile'),
        backgroundColor: const Color(0xFFFF6B35),
        foregroundColor: Colors.white,
      ),
      body: petsAsync.when(
        data: (pets) {
          final pet = pets.where((p) => p.id == widget.petId).firstOrNull;
          if (pet == null) {
            return const Center(child: Text('Pet not found'));
          }
          return _buildContent(pet);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Widget _buildContent(Pet pet) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: const Color(0xFFFF6B35),
                  child: const Icon(Icons.pets, size: 50, color: Colors.white),
                ),
                const SizedBox(height: 16),
                Text(
                  pet.name,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (pet.breed != null)
                  Text(pet.breed!, style: const TextStyle(color: Colors.grey)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildInfoCard(pet),
          const SizedBox(height: 24),
          _buildVaccinationSection(),
        ],
      ),
    );
  }

  Widget _buildInfoCard(Pet pet) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Details',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Divider(),
            _buildInfoRow('Breed', pet.breed ?? 'Not specified'),
            _buildInfoRow('Date of Birth', pet.dob ?? 'Not specified'),
            _buildInfoRow('Notes', pet.notes ?? 'No notes'),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: const TextStyle(color: Colors.grey)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Widget _buildVaccinationSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Vaccination Log',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.add_circle, color: Color(0xFFFF6B35)),
                  onPressed: _showAddVaccinationDialog,
                ),
              ],
            ),
            const Divider(),
            TextField(
              controller: _vaccineNameController,
              decoration: InputDecoration(
                labelText: 'Vaccine Name',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _dateGivenController,
              decoration: InputDecoration(
                labelText: 'Date Given',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _nextDueController,
              decoration: InputDecoration(
                labelText: 'Next Due (optional)',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _addVaccination,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF6B35),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Add Vaccination'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddVaccinationDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Vaccination'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _vaccineNameController,
              decoration: const InputDecoration(labelText: 'Vaccine Name'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _dateGivenController,
              decoration: const InputDecoration(labelText: 'Date Given'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _nextDueController,
              decoration: const InputDecoration(labelText: 'Next Due'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _addVaccination();
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
