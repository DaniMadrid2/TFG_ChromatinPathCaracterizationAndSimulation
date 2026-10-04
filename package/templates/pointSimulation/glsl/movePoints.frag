#version 300 es
precision highp float;

uniform sampler2D positionTexture;
uniform float dt;//we have to add dt to the speed to make it frame rate independent

out vec2 position;
void main() {

  //this fragment shader will have the position texture width and height
  //first get the i'th position and make it go away from the other points
  //and make it rotate clockwise towards the center of the points with
  //a speed depending on the distance to the center of the points
  //the center of the points is the average of the positions of the points
  //the distance to the center of the points is the distance from the position to the center of the points
  //the speed is a function of the distance to the center of the points squared
  //Also the speed related to the position of other points should be
  //calculated so that the point linearly tries to stay 0.1 unit away from every point
  //Also we need a force that is attracted to points further than 0.6 units
  //with cubic force

  ivec2 texSize = textureSize(positionTexture, 0);
  vec2 uv = gl_FragCoord.xy / vec2(texSize);
  vec4 pos = texture(positionTexture, uv);

  //calculate center of points
  vec2 center = vec2(0.0);
  for(int i = 0; i < texSize.x; i++){
    for(int j = 0; j < texSize.y; j++){
      vec4 p = texelFetch(positionTexture, ivec2(i,j), 0);
      center += p.xy;
    }
  }
  center /= float(texSize.x * texSize.y);

  //calculate distance to center
  float dist = distance(pos.xy, center);

  const float globalSpeedMag = 0.04;

  //calculate speed based on distance to center
  float speed = dist * dist * 0.1 * globalSpeedMag;

  //calculate direction to center
  vec2 dir = normalize(center - pos.xy);

  //calculate new position
  vec2 newPos = pos.xy + dir * speed * dt;

  //calculate force from other points
  for(int i = 0; i < texSize.x; i++){
    for(int j = 0; j < texSize.y; j++){
      vec4 p = texelFetch(positionTexture, ivec2(i,j), 0);
      if(p.xy != pos.xy){
        float d = distance(newPos, p.xy);
        if(d < 0.1){
          newPos += (newPos - p.xy) * (0.1 - d) * 30.0 * dt * globalSpeedMag;
        }
        if(d > 0.6){
          newPos -= (newPos - p.xy) * (d - 0.6) * (d - 0.6) * 6.0 * dt * globalSpeedMag;
        }
        //Now add a random diffusion force
        newPos += vec2((fract(sin(dot(pos.xy ,vec2(12.9898,78.233))) * 43758.5453) - 0.5) * 0.01, (fract(sin(dot(pos.xy ,vec2(12.9898,78.233))) * 43758.5453) - 0.5) * 0.01) * 5.5 * dt * globalSpeedMag;
        //Now add a clockwise rotation force towards the center of the points
        //Make it so that the speed of the rotation is proportional to the distance to the center of the points cubed
        vec2 toCenter = normalize(center - newPos);
        vec2 clockwise = vec2(-toCenter.y, toCenter.x);
        newPos += clockwise * dist * dist * dist * 2.1 * dt * globalSpeedMag;

        //Now add an anticlockwise rotation also cubic but with a smaller radius
        //only if radius to center is less than 0.1 units
        if(dist < 0.2){
          vec2 anticlockwise = vec2(toCenter.y, -toCenter.x);
          newPos += anticlockwise * dist * dist * dist * 8.5 * dt * globalSpeedMag;
        }
      }
    }
  }

  position = newPos;
}
