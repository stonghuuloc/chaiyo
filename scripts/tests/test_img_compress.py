import subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
import img_compress as ic


def noisy_png(path, size):
    subprocess.run([*ic.IM, '-size', size, 'plasma:fractal', '-seed', '7', str(path)], check=True)


def dims(path):
    return subprocess.run([*ic.IM, 'identify', '-format', '%wx%h', str(path)], capture_output=True, text=True, check=True).stdout


def test_compress_caps_long_edge_and_shrinks(tmp_path):
    src, dst = tmp_path / 'a.png', tmp_path / 'out/a.png'
    noisy_png(src, '1536x1024')
    size = ic.compress_png(src, dst)
    assert dims(dst) == '860x573'
    assert size == dst.stat().st_size < src.stat().st_size / 4


def test_compress_never_upscales(tmp_path):
    src, dst = tmp_path / 'a.png', tmp_path / 'b.png'
    noisy_png(src, '160x160')
    ic.compress_png(src, dst)
    assert dims(dst) == '160x160'


def test_compress_keeps_alpha(tmp_path):
    src, dst = tmp_path / 'a.png', tmp_path / 'b.png'
    subprocess.run([*ic.IM, '-size', '64x64', 'xc:none', '-fill', 'red', '-draw', 'circle 32,32 32,2', str(src)], check=True)
    ic.compress_png(src, dst)
    corner = subprocess.run([*ic.IM, str(dst), '-format', '%[fx:p{0,0}.a]', 'info:'], capture_output=True, text=True, check=True).stdout
    assert float(corner) == 0


def test_check_budget_flags_only_files_above_limit(tmp_path):
    small, big = tmp_path / 's.png', tmp_path / 'b.png'
    small.write_bytes(b'x' * 10)
    big.write_bytes(b'x' * 401)
    assert ic.check_budget([small, big], budget=400) == [(str(big), 401)]
    assert ic.check_budget([small, big], budget=401) == []


def test_cli_budget_mode_exits_1_above_budget(tmp_path):
    big = tmp_path / 'b.png'
    big.write_bytes(b'x' * (ic.BUDGET + 1))
    assert ic.main(['--budget', str(big)]) == 1
    big.write_bytes(b'x' * ic.BUDGET)
    assert ic.main(['--budget', str(big)]) == 0
