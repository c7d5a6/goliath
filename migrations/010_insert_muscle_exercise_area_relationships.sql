-- Insert muscle to exercise area relationships
-- Exercise area IDs: Horizontal Push=1, Vertical Push (Up)=2, Vertical Push (Down)=3, Lateral Push=4, Legs Push=5
-- Vertical Pull=6, Horizontal Pull=7, Lateral Pull=8, Legs Pull=9, Scapular Control=10
-- Core=11, Rotation=12, Stabilizers=13, Grip=14

-- Anterior deltoid: Horizontal Push, Vertical Push (Up), Vertical Push (Down), Lateral Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (1, 1, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (1, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (1, 3, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (1, 4, 'migration');

-- Lateral deltoid: Vertical Push (Up), Lateral Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (2, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (2, 4, 'migration');

-- Posterior deltoid: Horizontal Pull, Vertical Pull, Lateral Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (3, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (3, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (3, 4, 'migration');

-- Rotator cuff muscles (4-7): Horizontal Pull, Vertical Push (Up), Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (4, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (4, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (4, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (5, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (5, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (5, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (6, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (6, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (6, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (7, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (7, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (7, 13, 'migration');

-- Pectoralis major (clavicular, sternal): Horizontal Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (8, 1, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (9, 1, 'migration');

-- Pectoralis minor: Horizontal Push, Vertical Push (Down)
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (10, 1, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (10, 3, 'migration');

-- Trapezius (upper): Vertical Pull, Vertical Push (Up), Scapular Control
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (11, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (11, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (11, 10, 'migration');

-- Trapezius (middle): Horizontal Pull, Scapular Control
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (12, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (12, 10, 'migration');

-- Trapezius (lower): Vertical Pull, Vertical Push (Down), Scapular Control
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (13, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (13, 3, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (13, 10, 'migration');

-- Latissimus dorsi: Horizontal Pull, Vertical Pull, Vertical Push (Down)
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (14, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (14, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (14, 3, 'migration');

-- Rhomboids (major, minor): Horizontal Pull, Vertical Pull, Scapular Control
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (15, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (15, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (15, 10, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (16, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (16, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (16, 10, 'migration');

-- Serratus anterior: Vertical Push (Up), Vertical Push (Down), Stabilizers, Scapular Control
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (17, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (17, 3, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (17, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (17, 10, 'migration');

-- Teres major: Horizontal Pull, Vertical Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (18, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (18, 6, 'migration');

-- Biceps brachii: Horizontal Pull, Vertical Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (19, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (19, 6, 'migration');

-- Brachialis: Vertical Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (20, 6, 'migration');

-- Triceps brachii (long head): Horizontal Push, Vertical Push (Up), Vertical Push (Down)
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (21, 1, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (21, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (21, 3, 'migration');

-- Triceps brachii (lateral head, medial head): Horizontal Push, Vertical Push (Up)
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (22, 1, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (22, 2, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (23, 1, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (23, 2, 'migration');

-- Forearm flexors, Wrist flexors, Forearm extensors, Wrist extensors: Horizontal Pull, Vertical Pull, Stabilizers, Grip
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (24, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (24, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (24, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (24, 14, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (25, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (25, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (25, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (25, 14, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (26, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (26, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (26, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (26, 14, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (27, 7, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (27, 6, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (27, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (27, 14, 'migration');

-- Pronators, Supinators: Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (28, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (29, 13, 'migration');

-- Sternocleidomastoid: Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (30, 13, 'migration');

-- Levator scapulae: Stabilizers, Scapular Control
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (31, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (31, 10, 'migration');

-- Splenius capitis, Splenius cervicis: Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (32, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (33, 13, 'migration');

-- Rectus abdominis: Core
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (34, 11, 'migration');

-- External obliques, Internal obliques, Transverse abdominis: Core, Rotation
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (35, 11, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (35, 12, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (36, 11, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (36, 12, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (37, 11, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (37, 12, 'migration');

-- Multifidus: Core, Rotation
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (38, 11, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (38, 12, 'migration');

-- Quadratus lumborum: Core
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (39, 11, 'migration');

-- Erector spinae (lumbar): Legs Pull, Core
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (40, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (40, 11, 'migration');

-- Erector spinae (spinalis, longissimus, iliocostalis): Core, Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (41, 11, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (41, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (42, 11, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (42, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (43, 11, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (43, 13, 'migration');

-- Gluteus maximus: Legs Push, Legs Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (44, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (44, 9, 'migration');

-- Gluteus medius: Legs Push, Legs Pull, Lateral Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (45, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (45, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (45, 4, 'migration');

-- Gluteus minimus, Tensor fasciae latae: Legs Push, Lateral Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (46, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (46, 4, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (47, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (47, 4, 'migration');

-- Quadriceps (all 4): Legs Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (48, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (49, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (50, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (51, 5, 'migration');

-- Hamstrings (all 3): Legs Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (52, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (53, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (54, 9, 'migration');

-- Adductors (all 5): Legs Pull, Lateral Pull
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (55, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (55, 8, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (56, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (56, 8, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (57, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (57, 8, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (58, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (58, 8, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (59, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (59, 8, 'migration');

-- Hip flexors: Legs Pull, Core
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (60, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (60, 11, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (61, 9, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (61, 11, 'migration');

-- Calves: Legs Push
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (62, 5, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (63, 5, 'migration');

-- Lower leg stabilizers: Stabilizers
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (64, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (65, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (66, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (67, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (68, 13, 'migration');
INSERT INTO muscle_exercise_area (muscle_id, exercise_area_id, created_by) VALUES (69, 13, 'migration');

